#!/usr/bin/env bash
# ============================================================
# scripts/stripe-smoke-test.sh
# Automated Stripe smoke-test suite for MMM Event OS
#
# Prerequisites:
#   1. stripe listen --forward-to localhost:3001/api/stripe/webhook
#   2. npm run dev (on port 3001)
#   3. .env.local populated with Supabase + Stripe test keys
#
# Usage:  ./scripts/stripe-smoke-test.sh
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ---- Load env ----
export $(grep -v '^#' "$SCRIPT_DIR/.env.local" | grep -v '^$' | xargs)

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SB_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET}"
WEBHOOK_URL="http://localhost:3001/api/stripe/webhook"
MMM_ORG_ID="22650971-d184-4cb3-a5af-ddfa579a8d1b"
HHH_ORG_ID="9bce273e-0e77-44d7-9fe6-7d99382227e2"
HHH_EVENT_ID="c7b8a081-d488-482c-8a20-d993663c54b8"

# ---- Colours ----
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ---- Counters ----
PASS=0
FAIL=0
declare -a RESULTS=()

# ---- Helpers ----
log()  { printf "${CYAN}▸${NC} %s\n" "$*"; }
pass() { ((PASS++)); RESULTS+=("PASS|$1"); printf "  ${GREEN}✓ PASS${NC} %s\n" "$1"; }
fail() { ((FAIL++)); RESULTS+=("FAIL|$1|$2"); printf "  ${RED}✗ FAIL${NC} %s — %s\n" "$1" "$2"; }

# Supabase REST query helper
# Usage: sb_query "table" "select=col&filter=val"
sb_query() {
  local table="$1"
  local params="$2"
  curl -s "${SUPABASE_URL}/rest/v1/${table}?${params}" \
    -H "apikey: ${SB_KEY}" \
    -H "Authorization: Bearer ${SB_KEY}" \
    -H "Accept: application/json"
}

# Supabase DELETE helper
sb_delete() {
  local table="$1"
  local filter="$2"
  curl -s -X DELETE "${SUPABASE_URL}/rest/v1/${table}?${filter}" \
    -H "apikey: ${SB_KEY}" \
    -H "Authorization: Bearer ${SB_KEY}" \
    -H "Accept: application/json"
}

# Supabase INSERT helper
sb_insert() {
  local table="$1"
  local payload="$2"
  curl -s -X POST "${SUPABASE_URL}/rest/v1/${table}" \
    -H "apikey: ${SB_KEY}" \
    -H "Authorization: Bearer ${SB_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "$payload"
}

# Sign a webhook payload and POST it
# Returns HTTP status code
fire_webhook() {
  local payload="$1"
  local timestamp
  timestamp=$(date +%s)
  local signed_payload="${timestamp}.${payload}"
  local signature
  signature=$(printf '%s' "$signed_payload" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')
  local sig_header="t=${timestamp},v1=${signature}"

  curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -H "stripe-signature: ${sig_header}" \
    -d "$payload"
}

# Build a checkout.session.completed event payload (with waiver metadata)
build_checkout_event() {
  local evt_id="$1"      # Stripe event ID
  local session_id="$2"  # Checkout session ID
  local pi_id="$3"       # Payment intent ID
  local org_id="$4"
  local event_id="$5"
  local distance="$6"
  local amount="$7"
  local referral_code="${8:-}"
  local email="${9:-test@example.com}"

  cat <<EOF
{
  "id": "${evt_id}",
  "object": "event",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "${session_id}",
      "object": "checkout.session",
      "payment_intent": "${pi_id}",
      "amount_total": ${amount},
      "currency": "usd",
      "customer_email": "${email}",
      "metadata": {
        "org_id": "${org_id}",
        "event_id": "${event_id}",
        "distance": "${distance}",
        "referral_code": "${referral_code}",
        "user_id": "",
        "waiver_accepted": "true",
        "waiver_accepted_at": "2026-03-01T12:00:00.000Z",
        "waiver_ip": "127.0.0.1",
        "waiver_user_agent": "smoke-test/1.0",
        "waiver_version": "v1"
      }
    }
  }
}
EOF
}

# Build a charge.refunded event payload
build_refund_event() {
  local evt_id="$1"
  local charge_id="$2"
  local pi_id="$3"
  local amount_refunded="$4"

  cat <<EOF
{
  "id": "${evt_id}",
  "object": "event",
  "type": "charge.refunded",
  "data": {
    "object": {
      "id": "${charge_id}",
      "object": "charge",
      "payment_intent": "${pi_id}",
      "amount": ${amount_refunded},
      "amount_refunded": ${amount_refunded}
    }
  }
}
EOF
}

gen_uuid() { uuidgen | tr '[:upper:]' '[:lower:]'; }

# ============================================================
# Preflight checks
# ============================================================
printf "\n${BOLD}═══ MMM Event OS — Stripe Smoke Tests ═══${NC}\n\n"

log "Checking dev server on :3001…"
if ! curl -s -o /dev/null -w "" http://localhost:3001/ 2>/dev/null; then
  printf "${RED}Dev server not reachable on localhost:3001. Aborting.${NC}\n"; exit 1
fi
log "Dev server OK"

log "Checking stripe listen process…"
if ! pgrep -f "stripe listen" > /dev/null; then
  printf "${YELLOW}⚠  stripe listen not detected — webhook tests will POST directly${NC}\n"
fi

# ============================================================
# Seed: create FFF event if it doesn't exist
# ============================================================
log "Checking for FFF event…"
FFF_EVENT=$(sb_query "events" "select=id&title=eq.Fun%20Friday%20Fifty" | jq -r '.[0].id // empty')

if [ -z "$FFF_EVENT" ]; then
  log "Seeding FFF event under MMM org…"
  FFF_EVENT_ID=$(gen_uuid)
  sb_insert "events" "$(cat <<EOF
{
  "id": "${FFF_EVENT_ID}",
  "org_id": "${MMM_ORG_ID}",
  "title": "Fun Friday Fifty",
  "description": "A 50-mile charity ride",
  "date": "2026-06-20T08:00:00Z",
  "location": "Hancock, MI",
  "status": "published"
}
EOF
)" > /dev/null
  FFF_EVENT="$FFF_EVENT_ID"
  log "Created FFF event: ${FFF_EVENT}"
else
  log "FFF event exists: ${FFF_EVENT}"
fi

# ============================================================
# Generate unique IDs for this test run
# ============================================================
RUN_TAG=$(date +%s)

# Sessions & payment intents
CS_A="cs_smoke_a_${RUN_TAG}"
PI_A="pi_smoke_a_${RUN_TAG}"
CS_B="cs_smoke_b_${RUN_TAG}"
PI_B="pi_smoke_b_${RUN_TAG}"
CS_C="cs_smoke_c_${RUN_TAG}"
PI_C="pi_smoke_c_${RUN_TAG}"
CS_D="cs_smoke_d_${RUN_TAG}"
PI_D="pi_smoke_d_${RUN_TAG}"
CS_E="cs_smoke_e_${RUN_TAG}"
PI_E="pi_smoke_e_${RUN_TAG}"
CS_F="cs_smoke_f_${RUN_TAG}"
PI_F="pi_smoke_f_${RUN_TAG}"
CS_FREE="cs_smoke_free_${RUN_TAG}"
PI_FREE="pi_smoke_free_${RUN_TAG}"
CS_FREEREF="cs_smoke_freeref_${RUN_TAG}"
PI_FREEREF="pi_smoke_freeref_${RUN_TAG}"

# ============================================================
# Test A: HHH 30 miles — paid, $48.99
# ============================================================
printf "\n${BOLD}[A] HHH 30 miles — checkout.session.completed (\$48.99)${NC}\n"
PAYLOAD_A=$(build_checkout_event "evt_smoke_a_${RUN_TAG}" "$CS_A" "$PI_A" \
  "$MMM_ORG_ID" "$HHH_EVENT_ID" "30 miles" 4899 "" "runner30@test.com")

STATUS_A=$(fire_webhook "$PAYLOAD_A")
if [ "$STATUS_A" = "200" ]; then
  # Verify registration in DB
  sleep 0.5
  REG_A=$(sb_query "registrations" "select=id,status,distance,amount,waiver_accepted,waiver_ip,waiver_version&stripe_session_id=eq.${CS_A}" | jq '.[0]')
  REG_A_STATUS=$(echo "$REG_A" | jq -r '.status // empty')
  REG_A_DIST=$(echo "$REG_A" | jq -r '.distance // empty')
  REG_A_AMT=$(echo "$REG_A" | jq -r '.amount // 0')
  REG_A_WAIVER=$(echo "$REG_A" | jq -r '.waiver_accepted // false')
  REG_A_WIP=$(echo "$REG_A" | jq -r '.waiver_ip // empty')
  REG_A_WVER=$(echo "$REG_A" | jq -r '.waiver_version // empty')

  A_OK=true
  if [ "$REG_A_STATUS" != "paid" ] || [ "$REG_A_DIST" != "30 miles" ] || [ "$REG_A_AMT" != "4899" ]; then
    fail "A: HHH 30mi registration" "status=${REG_A_STATUS}, dist=${REG_A_DIST}, amt=${REG_A_AMT}"
    A_OK=false
  fi
  if [ "$REG_A_WAIVER" != "true" ] || [ "$REG_A_WIP" != "127.0.0.1" ] || [ "$REG_A_WVER" != "v1" ]; then
    fail "A: HHH 30mi waiver fields" "waiver=${REG_A_WAIVER}, ip=${REG_A_WIP}, ver=${REG_A_WVER}"
    A_OK=false
  fi
  if [ "$A_OK" = "true" ]; then
    pass "A: HHH 30mi registration created (paid, \$48.99, waiver OK)"
  fi
else
  fail "A: HHH 30mi" "webhook returned HTTP ${STATUS_A}"
fi

# ============================================================
# Test B: HHH 62 miles — paid, $64.99
# ============================================================
printf "\n${BOLD}[B] HHH 62 miles — checkout.session.completed (\$64.99)${NC}\n"
PAYLOAD_B=$(build_checkout_event "evt_smoke_b_${RUN_TAG}" "$CS_B" "$PI_B" \
  "$MMM_ORG_ID" "$HHH_EVENT_ID" "62 miles" 6499 "" "runner62@test.com")

STATUS_B=$(fire_webhook "$PAYLOAD_B")
if [ "$STATUS_B" = "200" ]; then
  sleep 0.5
  REG_B=$(sb_query "registrations" "select=status,amount&stripe_session_id=eq.${CS_B}" | jq '.[0]')
  REG_B_STATUS=$(echo "$REG_B" | jq -r '.status // empty')
  REG_B_AMT=$(echo "$REG_B" | jq -r '.amount // 0')
  if [ "$REG_B_STATUS" = "paid" ] && [ "$REG_B_AMT" = "6499" ]; then
    pass "B: HHH 62mi registration created (paid, \$64.99)"
  else
    fail "B: HHH 62mi" "status=${REG_B_STATUS}, amt=${REG_B_AMT}"
  fi
else
  fail "B: HHH 62mi" "webhook returned HTTP ${STATUS_B}"
fi

# ============================================================
# Test C: HHH 100 miles — paid, $74.99
# ============================================================
printf "\n${BOLD}[C] HHH 100 miles — checkout.session.completed (\$74.99)${NC}\n"
PAYLOAD_C=$(build_checkout_event "evt_smoke_c_${RUN_TAG}" "$CS_C" "$PI_C" \
  "$MMM_ORG_ID" "$HHH_EVENT_ID" "100 miles" 7499 "" "runner100@test.com")

STATUS_C=$(fire_webhook "$PAYLOAD_C")
if [ "$STATUS_C" = "200" ]; then
  sleep 0.5
  REG_C=$(sb_query "registrations" "select=status,amount&stripe_session_id=eq.${CS_C}" | jq '.[0]')
  REG_C_STATUS=$(echo "$REG_C" | jq -r '.status // empty')
  REG_C_AMT=$(echo "$REG_C" | jq -r '.amount // 0')
  if [ "$REG_C_STATUS" = "paid" ] && [ "$REG_C_AMT" = "7499" ]; then
    pass "C: HHH 100mi registration created (paid, \$74.99)"
  else
    fail "C: HHH 100mi" "status=${REG_C_STATUS}, amt=${REG_C_AMT}"
  fi
else
  fail "C: HHH 100mi" "webhook returned HTTP ${STATUS_C}"
fi

# ============================================================
# Test D: FFF event — paid, $35.00
# ============================================================
printf "\n${BOLD}[D] Fun Friday Fifty — checkout.session.completed (\$35.00)${NC}\n"
PAYLOAD_D=$(build_checkout_event "evt_smoke_d_${RUN_TAG}" "$CS_D" "$PI_D" \
  "$MMM_ORG_ID" "$FFF_EVENT" "50 miles" 3500 "" "fff-rider@test.com")

STATUS_D=$(fire_webhook "$PAYLOAD_D")
if [ "$STATUS_D" = "200" ]; then
  sleep 0.5
  REG_D=$(sb_query "registrations" "select=status,amount&stripe_session_id=eq.${CS_D}" | jq '.[0]')
  REG_D_STATUS=$(echo "$REG_D" | jq -r '.status // empty')
  REG_D_AMT=$(echo "$REG_D" | jq -r '.amount // 0')
  if [ "$REG_D_STATUS" = "paid" ] && [ "$REG_D_AMT" = "3500" ]; then
    pass "D: FFF registration created (paid, \$35.00)"
  else
    fail "D: FFF" "status=${REG_D_STATUS}, amt=${REG_D_AMT}"
  fi
else
  fail "D: FFF" "webhook returned HTTP ${STATUS_D}"
fi

# ============================================================
# Test E: Paid with referral code — verify referral credit
# ============================================================
printf "\n${BOLD}[E] HHH 62mi + referral code FRIEND2026${NC}\n"
PAYLOAD_E=$(build_checkout_event "evt_smoke_e_${RUN_TAG}" "$CS_E" "$PI_E" \
  "$MMM_ORG_ID" "$HHH_EVENT_ID" "62 miles" 6499 "FRIEND2026" "referral@test.com")

STATUS_E=$(fire_webhook "$PAYLOAD_E")
if [ "$STATUS_E" = "200" ]; then
  sleep 0.5
  REG_E=$(sb_query "registrations" "select=id,status,referral_code&stripe_session_id=eq.${CS_E}" | jq '.[0]')
  REG_E_ID=$(echo "$REG_E" | jq -r '.id // empty')
  REG_E_STATUS=$(echo "$REG_E" | jq -r '.status // empty')
  REG_E_CODE=$(echo "$REG_E" | jq -r '.referral_code // empty')

  if [ "$REG_E_STATUS" = "paid" ] && [ "$REG_E_CODE" = "FRIEND2026" ]; then
    # Check referral credit was created
    CREDIT_E=$(sb_query "referral_credits" "select=id,amount,voided&registration_id=eq.${REG_E_ID}" | jq '.[0]')
    CREDIT_E_AMT=$(echo "$CREDIT_E" | jq -r '.amount // 0')
    CREDIT_E_VOIDED=$(echo "$CREDIT_E" | jq -r '.voided // empty')

    if [ "$CREDIT_E_AMT" = "500" ] && [ "$CREDIT_E_VOIDED" != "true" ]; then
      pass "E: Referral registration + \$5 credit created"
    else
      fail "E: Referral credit" "amt=${CREDIT_E_AMT}, voided=${CREDIT_E_VOIDED}"
    fi
  else
    fail "E: Referral registration" "status=${REG_E_STATUS}, code=${REG_E_CODE}"
  fi
else
  fail "E: Referral" "webhook returned HTTP ${STATUS_E}"
fi

# ============================================================
# Test F: Webhook idempotency — send same event twice
# ============================================================
printf "\n${BOLD}[F] Idempotency — replay checkout webhook${NC}\n"
PAYLOAD_F=$(build_checkout_event "evt_smoke_f_${RUN_TAG}" "$CS_F" "$PI_F" \
  "$MMM_ORG_ID" "$HHH_EVENT_ID" "30 miles" 4899 "IDEM_CODE" "idem@test.com")

STATUS_F1=$(fire_webhook "$PAYLOAD_F")
sleep 0.5
STATUS_F2=$(fire_webhook "$PAYLOAD_F")
sleep 0.5

if [ "$STATUS_F1" = "200" ] && [ "$STATUS_F2" = "200" ]; then
  # Count registrations with this session ID (should be exactly 1)
  REG_F_COUNT=$(sb_query "registrations" "select=id&stripe_session_id=eq.${CS_F}" | jq 'length')

  # Get registration ID for credit check
  REG_F_ID=$(sb_query "registrations" "select=id&stripe_session_id=eq.${CS_F}" | jq -r '.[0].id // empty')
  CREDIT_F_COUNT=$(sb_query "referral_credits" "select=id&registration_id=eq.${REG_F_ID}" | jq 'length')

  if [ "$REG_F_COUNT" = "1" ] && [ "$CREDIT_F_COUNT" = "1" ]; then
    pass "F: Idempotent — 1 registration, 1 credit after 2 webhooks"
  else
    fail "F: Idempotency" "registrations=${REG_F_COUNT}, credits=${CREDIT_F_COUNT}"
  fi
else
  fail "F: Idempotency" "HTTP responses: ${STATUS_F1}, ${STATUS_F2}"
fi

# ============================================================
# Test FREE: HHH 15mi — free tier (amount=0, status=free)
# ============================================================
printf "\n${BOLD}[FREE] HHH 15 miles — free tier via webhook (amount=0)${NC}\n"
PAYLOAD_FREE=$(build_checkout_event "evt_smoke_free_${RUN_TAG}" "$CS_FREE" "$PI_FREE" \
  "$MMM_ORG_ID" "$HHH_EVENT_ID" "15 miles" 0 "" "free15@test.com")

STATUS_FREE=$(fire_webhook "$PAYLOAD_FREE")
if [ "$STATUS_FREE" = "200" ]; then
  sleep 0.5
  REG_FREE=$(sb_query "registrations" "select=id,status,amount,waiver_accepted,waiver_ip&stripe_session_id=eq.${CS_FREE}" | jq '.[0]')
  REG_FREE_STATUS=$(echo "$REG_FREE" | jq -r '.status // empty')
  REG_FREE_AMT=$(echo "$REG_FREE" | jq -r '.amount // 0')
  REG_FREE_WAIVER=$(echo "$REG_FREE" | jq -r '.waiver_accepted // false')

  if [ "$REG_FREE_STATUS" = "paid" ] && [ "$REG_FREE_AMT" = "0" ] && [ "$REG_FREE_WAIVER" = "true" ]; then
    pass "FREE: HHH 15mi free-tier registration (amount=0, waiver OK)"
  else
    fail "FREE: HHH 15mi" "status=${REG_FREE_STATUS}, amt=${REG_FREE_AMT}, waiver=${REG_FREE_WAIVER}"
  fi
else
  fail "FREE: HHH 15mi" "webhook returned HTTP ${STATUS_FREE}"
fi

# ============================================================
# Test FREEREF: Free tier + referral code — NO credit should be created
# ============================================================
printf "\n${BOLD}[FREEREF] HHH 15mi + referral code — no credit for free tier${NC}\n"
PAYLOAD_FREEREF=$(build_checkout_event "evt_smoke_freeref_${RUN_TAG}" "$CS_FREEREF" "$PI_FREEREF" \
  "$MMM_ORG_ID" "$HHH_EVENT_ID" "15 miles" 0 "FREE_REF_CODE" "freeref@test.com")

STATUS_FREEREF=$(fire_webhook "$PAYLOAD_FREEREF")
if [ "$STATUS_FREEREF" = "200" ]; then
  sleep 0.5
  REG_FREEREF_ID=$(sb_query "registrations" "select=id&stripe_session_id=eq.${CS_FREEREF}" | jq -r '.[0].id // empty')

  if [ -n "$REG_FREEREF_ID" ]; then
    CREDIT_FREEREF_COUNT=$(sb_query "referral_credits" "select=id&registration_id=eq.${REG_FREEREF_ID}" | jq 'length')
    if [ "$CREDIT_FREEREF_COUNT" = "0" ]; then
      pass "FREEREF: No referral credit created for free-tier registration"
    else
      fail "FREEREF: Referral credit guard" "expected 0 credits, got ${CREDIT_FREEREF_COUNT}"
    fi
  else
    fail "FREEREF: Registration" "registration not found"
  fi
else
  fail "FREEREF: Free+referral" "webhook returned HTTP ${STATUS_FREEREF}"
fi

# ============================================================
# Test G: charge.refunded — status + credit voided
# ============================================================
printf "\n${BOLD}[G] Refund — charge.refunded for test E's payment${NC}\n"
REFUND_PAYLOAD=$(build_refund_event "evt_smoke_refund_${RUN_TAG}" "ch_smoke_${RUN_TAG}" "$PI_E" 6499)

STATUS_G=$(fire_webhook "$REFUND_PAYLOAD")
if [ "$STATUS_G" = "200" ]; then
  sleep 0.5
  REG_G_STATUS=$(sb_query "registrations" "select=status&stripe_session_id=eq.${CS_E}" | jq -r '.[0].status // empty')
  CREDIT_G_VOIDED=$(sb_query "referral_credits" "select=voided&registration_id=eq.${REG_E_ID}" | jq -r '.[0].voided // empty')

  REFUND_OK=true
  if [ "$REG_G_STATUS" != "refunded" ]; then
    fail "G: Refund status" "expected refunded, got ${REG_G_STATUS}"
    REFUND_OK=false
  fi
  if [ "$CREDIT_G_VOIDED" != "true" ]; then
    fail "G: Referral credit void" "expected voided=true, got ${CREDIT_G_VOIDED}"
    REFUND_OK=false
  fi
  if [ "$REFUND_OK" = "true" ]; then
    pass "G: Refund → registration=refunded, credit=voided"
  fi
else
  fail "G: Refund" "webhook returned HTTP ${STATUS_G}"
fi

# ============================================================
# Test H: Unhandled event type — should return 200 (ack)
# ============================================================
printf "\n${BOLD}[H] Unhandled event type — graceful ack${NC}\n"
UNKNOWN_PAYLOAD=$(cat <<EOF
{
  "id": "evt_smoke_h_${RUN_TAG}",
  "object": "event",
  "type": "payment_intent.created",
  "data": {
    "object": {
      "id": "pi_unknown_${RUN_TAG}",
      "object": "payment_intent"
    }
  }
}
EOF
)

STATUS_H=$(fire_webhook "$UNKNOWN_PAYLOAD")
if [ "$STATUS_H" = "200" ]; then
  pass "H: Unhandled event type returns 200"
else
  fail "H: Unhandled event" "expected 200, got ${STATUS_H}"
fi

# ============================================================
# Cleanup: remove smoke-test registrations and credits
# ============================================================
printf "\n${BOLD}Cleaning up smoke-test data…${NC}\n"
for CS in "$CS_A" "$CS_B" "$CS_C" "$CS_D" "$CS_E" "$CS_F" "$CS_FREE" "$CS_FREEREF"; do
  REG_ID=$(sb_query "registrations" "select=id&stripe_session_id=eq.${CS}" | jq -r '.[0].id // empty')
  if [ -n "$REG_ID" ]; then
    sb_delete "referral_credits" "registration_id=eq.${REG_ID}" > /dev/null 2>&1 || true
    sb_delete "registrations" "id=eq.${REG_ID}" > /dev/null 2>&1 || true
  fi
done
log "Cleanup complete"

# ============================================================
# Summary
# ============================================================
TOTAL=$((PASS + FAIL))
printf "\n${BOLD}═══════════════════════════════════════════${NC}\n"
printf "${BOLD}  STRIPE SMOKE TEST RESULTS${NC}\n"
printf "${BOLD}═══════════════════════════════════════════${NC}\n"
printf "  %-6s %-50s %s\n" "Result" "Test" "Detail"
printf "  %-6s %-50s %s\n" "------" "--------------------------------------------------" "------"
for entry in "${RESULTS[@]}"; do
  IFS='|' read -r result name detail <<< "$entry"
  if [ "$result" = "PASS" ]; then
    printf "  ${GREEN}%-6s${NC} %-50s\n" "PASS" "$name"
  else
    printf "  ${RED}%-6s${NC} %-50s %s\n" "FAIL" "$name" "$detail"
  fi
done
printf "${BOLD}═══════════════════════════════════════════${NC}\n"
printf "  Total: ${TOTAL}   ${GREEN}Pass: ${PASS}${NC}   ${RED}Fail: ${FAIL}${NC}\n"
printf "${BOLD}═══════════════════════════════════════════${NC}\n\n"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
