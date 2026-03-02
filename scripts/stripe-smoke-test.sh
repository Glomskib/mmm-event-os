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
CHECKOUT_URL="http://localhost:3001/api/stripe/checkout"
WAIVER_URL="http://localhost:3001/api/waiver/accept"
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
declare -a CLEANUP_REG_IDS=()

# ---- Helpers ----
log()  { printf "${CYAN}▸${NC} %s\n" "$*"; }
pass() { ((PASS++)); RESULTS+=("PASS|$1"); printf "  ${GREEN}✓ PASS${NC} %s\n" "$1"; }
fail() { ((FAIL++)); RESULTS+=("FAIL|$1|$2"); printf "  ${RED}✗ FAIL${NC} %s — %s\n" "$1" "$2"; }

sb_query() {
  local table="$1"
  local params="$2"
  curl -s "${SUPABASE_URL}/rest/v1/${table}?${params}" \
    -H "apikey: ${SB_KEY}" \
    -H "Authorization: Bearer ${SB_KEY}" \
    -H "Accept: application/json"
}

sb_delete() {
  local table="$1"
  local filter="$2"
  curl -s -X DELETE "${SUPABASE_URL}/rest/v1/${table}?${filter}" \
    -H "apikey: ${SB_KEY}" \
    -H "Authorization: Bearer ${SB_KEY}" \
    -H "Accept: application/json"
}

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

# Build a checkout.session.completed event with registration_id in metadata
build_checkout_event_v2() {
  local evt_id="$1"
  local session_id="$2"
  local pi_id="$3"
  local org_id="$4"
  local event_id="$5"
  local distance="$6"
  local amount="$7"
  local registration_id="$8"
  local referral_code="${9:-}"
  local email="${10:-test@example.com}"

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
        "registration_id": "${registration_id}",
        "org_id": "${org_id}",
        "event_id": "${event_id}",
        "distance": "${distance}",
        "referral_code": "${referral_code}",
        "user_id": ""
      }
    }
  }
}
EOF
}

# Legacy build (without registration_id — backward compat)
build_checkout_event_legacy() {
  local evt_id="$1"
  local session_id="$2"
  local pi_id="$3"
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

# Create a pending registration with waiver accepted (simulates /api/waiver/accept)
create_pending_reg() {
  local org_id="$1"
  local event_id="$2"
  local distance="$3"
  local amount="$4"
  local waiver_accepted="${5:-true}"
  local referral_code="${6:-}"
  local email="${7:-test@example.com}"

  local result
  result=$(sb_insert "registrations" "$(cat <<EOF
{
  "org_id": "${org_id}",
  "event_id": "${event_id}",
  "distance": "${distance}",
  "amount": ${amount},
  "status": "pending",
  "waiver_accepted": ${waiver_accepted},
  "waiver_accepted_at": "2026-03-01T12:00:00.000Z",
  "waiver_ip": "127.0.0.1",
  "waiver_user_agent": "smoke-test/1.0",
  "waiver_version": "2026-v1",
  "waiver_text_hash": "dbfb5e75819beb734c99a112afcca00d402fceff1c921f0c7adb977fb8c7f2be",
  "waiver_snapshot_text": "smoke-test waiver snapshot",
  "participant_name": "Smoke Test Runner",
  "participant_email": "${email}",
  "emergency_contact_name": "Emergency Contact",
  "emergency_contact_phone": "555-000-1234",
  "referral_code": $([ -n "$referral_code" ] && echo "\"${referral_code}\"" || echo "null"),
  "email": "${email}"
}
EOF
)")
  local reg_id
  reg_id=$(echo "$result" | jq -r '.[0].id // empty')
  CLEANUP_REG_IDS+=("$reg_id")
  echo "$reg_id"
}

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
FFF_EVENT=$(sb_query "events" "select=id&title=eq.Findlay%20Further%20Fondo" | jq -r '.[0].id // empty')

if [ -z "$FFF_EVENT" ]; then
  log "Seeding FFF event under MMM org…"
  FFF_EVENT_ID=$(gen_uuid)
  sb_insert "events" "$(cat <<EOF
{
  "id": "${FFF_EVENT_ID}",
  "org_id": "${MMM_ORG_ID}",
  "title": "Findlay Further Fondo",
  "description": "55-60 mile round trip ride from False Chord Brewing to Arlyn's Good Beer",
  "date": "2026-04-25T12:00:00Z",
  "location": "False Chord Brewing, Findlay, OH",
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

# ============================================================
# Test W1: Checkout fails without registration_id
# ============================================================
printf "\n${BOLD}[W1] Checkout rejects missing registration_id${NC}\n"
W1_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$CHECKOUT_URL" \
  -H "Content-Type: application/json" \
  -d '{}')
if [ "$W1_STATUS" = "400" ]; then
  pass "W1: Checkout returns 400 without registration_id"
else
  fail "W1: Checkout guard" "expected 400, got ${W1_STATUS}"
fi

# ============================================================
# Test W2: Checkout fails if waiver_accepted=false
# ============================================================
printf "\n${BOLD}[W2] Checkout rejects registration with waiver_accepted=false${NC}\n"
W2_REG_ID=$(create_pending_reg "$MMM_ORG_ID" "$HHH_EVENT_ID" "30 miles" 4899 "false")

W2_RESP=$(curl -s -w "\n%{http_code}" \
  -X POST "$CHECKOUT_URL" \
  -H "Content-Type: application/json" \
  -d "{\"registration_id\": \"${W2_REG_ID}\"}")
W2_STATUS=$(echo "$W2_RESP" | tail -1)

if [ "$W2_STATUS" = "400" ]; then
  pass "W2: Checkout returns 400 when waiver_accepted=false"
else
  fail "W2: Waiver enforcement" "expected 400, got ${W2_STATUS}"
fi

# ============================================================
# Test A: HHH 30mi — pending reg + webhook → paid ($48.99)
# ============================================================
printf "\n${BOLD}[A] HHH 30mi — waiver → webhook → paid (\$48.99)${NC}\n"
CS_A="cs_smoke_a_${RUN_TAG}"
PI_A="pi_smoke_a_${RUN_TAG}"
REG_A_ID=$(create_pending_reg "$MMM_ORG_ID" "$HHH_EVENT_ID" "30 miles" 4899 "true" "" "runner30@test.com")

PAYLOAD_A=$(build_checkout_event_v2 "evt_smoke_a_${RUN_TAG}" "$CS_A" "$PI_A" \
  "$MMM_ORG_ID" "$HHH_EVENT_ID" "30 miles" 4899 "$REG_A_ID" "" "runner30@test.com")

STATUS_A=$(fire_webhook "$PAYLOAD_A")
if [ "$STATUS_A" = "200" ]; then
  sleep 0.5
  REG_A=$(sb_query "registrations" "select=id,status,distance,amount,waiver_accepted,waiver_ip,waiver_version,waiver_text_hash&id=eq.${REG_A_ID}" | jq '.[0]')
  REG_A_STATUS=$(echo "$REG_A" | jq -r '.status // empty')
  REG_A_DIST=$(echo "$REG_A" | jq -r '.distance // empty')
  REG_A_AMT=$(echo "$REG_A" | jq -r '.amount // 0')
  REG_A_WAIVER=$(echo "$REG_A" | jq -r '.waiver_accepted // false')
  REG_A_WVER=$(echo "$REG_A" | jq -r '.waiver_version // empty')
  REG_A_WHASH=$(echo "$REG_A" | jq -r '.waiver_text_hash // empty')

  A_OK=true
  if [ "$REG_A_STATUS" != "paid" ] || [ "$REG_A_DIST" != "30 miles" ] || [ "$REG_A_AMT" != "4899" ]; then
    fail "A: HHH 30mi registration" "status=${REG_A_STATUS}, dist=${REG_A_DIST}, amt=${REG_A_AMT}"
    A_OK=false
  fi
  if [ "$REG_A_WAIVER" != "true" ] || [ "$REG_A_WVER" != "2026-v1" ] || [ -z "$REG_A_WHASH" ]; then
    fail "A: HHH 30mi waiver fields" "waiver=${REG_A_WAIVER}, ver=${REG_A_WVER}, hash=${REG_A_WHASH}"
    A_OK=false
  fi
  if [ "$A_OK" = "true" ]; then
    pass "A: HHH 30mi paid (\$48.99) — waiver preserved"
  fi
else
  fail "A: HHH 30mi" "webhook returned HTTP ${STATUS_A}"
fi

# ============================================================
# Test B: HHH 62mi — $64.99
# ============================================================
printf "\n${BOLD}[B] HHH 62mi — waiver → webhook → paid (\$64.99)${NC}\n"
CS_B="cs_smoke_b_${RUN_TAG}"
PI_B="pi_smoke_b_${RUN_TAG}"
REG_B_ID=$(create_pending_reg "$MMM_ORG_ID" "$HHH_EVENT_ID" "62 miles" 6499)

PAYLOAD_B=$(build_checkout_event_v2 "evt_smoke_b_${RUN_TAG}" "$CS_B" "$PI_B" \
  "$MMM_ORG_ID" "$HHH_EVENT_ID" "62 miles" 6499 "$REG_B_ID")

STATUS_B=$(fire_webhook "$PAYLOAD_B")
if [ "$STATUS_B" = "200" ]; then
  sleep 0.5
  REG_B_STATUS=$(sb_query "registrations" "select=status,amount&id=eq.${REG_B_ID}" | jq -r '.[0].status // empty')
  REG_B_AMT=$(sb_query "registrations" "select=amount&id=eq.${REG_B_ID}" | jq -r '.[0].amount // 0')
  if [ "$REG_B_STATUS" = "paid" ] && [ "$REG_B_AMT" = "6499" ]; then
    pass "B: HHH 62mi paid (\$64.99)"
  else
    fail "B: HHH 62mi" "status=${REG_B_STATUS}, amt=${REG_B_AMT}"
  fi
else
  fail "B: HHH 62mi" "webhook returned HTTP ${STATUS_B}"
fi

# ============================================================
# Test C: HHH 100mi — $74.99
# ============================================================
printf "\n${BOLD}[C] HHH 100mi — waiver → webhook → paid (\$74.99)${NC}\n"
CS_C="cs_smoke_c_${RUN_TAG}"
PI_C="pi_smoke_c_${RUN_TAG}"
REG_C_ID=$(create_pending_reg "$MMM_ORG_ID" "$HHH_EVENT_ID" "100 miles" 7499)

PAYLOAD_C=$(build_checkout_event_v2 "evt_smoke_c_${RUN_TAG}" "$CS_C" "$PI_C" \
  "$MMM_ORG_ID" "$HHH_EVENT_ID" "100 miles" 7499 "$REG_C_ID")

STATUS_C=$(fire_webhook "$PAYLOAD_C")
if [ "$STATUS_C" = "200" ]; then
  sleep 0.5
  REG_C_STATUS=$(sb_query "registrations" "select=status,amount&id=eq.${REG_C_ID}" | jq -r '.[0].status // empty')
  REG_C_AMT=$(sb_query "registrations" "select=amount&id=eq.${REG_C_ID}" | jq -r '.[0].amount // 0')
  if [ "$REG_C_STATUS" = "paid" ] && [ "$REG_C_AMT" = "7499" ]; then
    pass "C: HHH 100mi paid (\$74.99)"
  else
    fail "C: HHH 100mi" "status=${REG_C_STATUS}, amt=${REG_C_AMT}"
  fi
else
  fail "C: HHH 100mi" "webhook returned HTTP ${STATUS_C}"
fi

# ============================================================
# Test D: FFF — $35.00
# ============================================================
printf "\n${BOLD}[D] Findlay Further Fondo — waiver → webhook → paid (\$35.00)${NC}\n"
CS_D="cs_smoke_d_${RUN_TAG}"
PI_D="pi_smoke_d_${RUN_TAG}"
REG_D_ID=$(create_pending_reg "$MMM_ORG_ID" "$FFF_EVENT" "50 miles" 3500)

PAYLOAD_D=$(build_checkout_event_v2 "evt_smoke_d_${RUN_TAG}" "$CS_D" "$PI_D" \
  "$MMM_ORG_ID" "$FFF_EVENT" "50 miles" 3500 "$REG_D_ID")

STATUS_D=$(fire_webhook "$PAYLOAD_D")
if [ "$STATUS_D" = "200" ]; then
  sleep 0.5
  REG_D_STATUS=$(sb_query "registrations" "select=status,amount&id=eq.${REG_D_ID}" | jq -r '.[0].status // empty')
  REG_D_AMT=$(sb_query "registrations" "select=amount&id=eq.${REG_D_ID}" | jq -r '.[0].amount // 0')
  if [ "$REG_D_STATUS" = "paid" ] && [ "$REG_D_AMT" = "3500" ]; then
    pass "D: FFF paid (\$35.00)"
  else
    fail "D: FFF" "status=${REG_D_STATUS}, amt=${REG_D_AMT}"
  fi
else
  fail "D: FFF" "webhook returned HTTP ${STATUS_D}"
fi

# ============================================================
# Test E: Paid with referral code — verify referral credit
# ============================================================
printf "\n${BOLD}[E] HHH 62mi + referral FRIEND2026${NC}\n"
CS_E="cs_smoke_e_${RUN_TAG}"
PI_E="pi_smoke_e_${RUN_TAG}"
REG_E_ID=$(create_pending_reg "$MMM_ORG_ID" "$HHH_EVENT_ID" "62 miles" 6499 "true" "FRIEND2026" "referral@test.com")

PAYLOAD_E=$(build_checkout_event_v2 "evt_smoke_e_${RUN_TAG}" "$CS_E" "$PI_E" \
  "$MMM_ORG_ID" "$HHH_EVENT_ID" "62 miles" 6499 "$REG_E_ID" "FRIEND2026" "referral@test.com")

STATUS_E=$(fire_webhook "$PAYLOAD_E")
if [ "$STATUS_E" = "200" ]; then
  sleep 0.5
  REG_E_STATUS=$(sb_query "registrations" "select=status&id=eq.${REG_E_ID}" | jq -r '.[0].status // empty')

  if [ "$REG_E_STATUS" = "paid" ]; then
    CREDIT_E=$(sb_query "referral_credits" "select=id,amount,voided&registration_id=eq.${REG_E_ID}" | jq '.[0]')
    CREDIT_E_AMT=$(echo "$CREDIT_E" | jq -r '.amount // 0')
    CREDIT_E_VOIDED=$(echo "$CREDIT_E" | jq -r '.voided // empty')

    if [ "$CREDIT_E_AMT" = "500" ] && [ "$CREDIT_E_VOIDED" != "true" ]; then
      pass "E: Referral registration + \$5 credit"
    else
      fail "E: Referral credit" "amt=${CREDIT_E_AMT}, voided=${CREDIT_E_VOIDED}"
    fi
  else
    fail "E: Referral registration" "status=${REG_E_STATUS}"
  fi
else
  fail "E: Referral" "webhook returned HTTP ${STATUS_E}"
fi

# ============================================================
# Test F: Idempotency — send same webhook twice
# ============================================================
printf "\n${BOLD}[F] Idempotency — replay webhook${NC}\n"
CS_F="cs_smoke_f_${RUN_TAG}"
PI_F="pi_smoke_f_${RUN_TAG}"
REG_F_ID=$(create_pending_reg "$MMM_ORG_ID" "$HHH_EVENT_ID" "30 miles" 4899 "true" "IDEM_CODE")

PAYLOAD_F=$(build_checkout_event_v2 "evt_smoke_f_${RUN_TAG}" "$CS_F" "$PI_F" \
  "$MMM_ORG_ID" "$HHH_EVENT_ID" "30 miles" 4899 "$REG_F_ID" "IDEM_CODE" "idem@test.com")

STATUS_F1=$(fire_webhook "$PAYLOAD_F")
sleep 0.5
STATUS_F2=$(fire_webhook "$PAYLOAD_F")
sleep 0.5

if [ "$STATUS_F1" = "200" ] && [ "$STATUS_F2" = "200" ]; then
  REG_F_STATUS=$(sb_query "registrations" "select=status&id=eq.${REG_F_ID}" | jq -r '.[0].status // empty')
  CREDIT_F_COUNT=$(sb_query "referral_credits" "select=id&registration_id=eq.${REG_F_ID}" | jq 'length')

  if [ "$REG_F_STATUS" = "paid" ] && [ "$CREDIT_F_COUNT" = "1" ]; then
    pass "F: Idempotent — paid, 1 credit after 2 webhooks"
  else
    fail "F: Idempotency" "status=${REG_F_STATUS}, credits=${CREDIT_F_COUNT}"
  fi
else
  fail "F: Idempotency" "HTTP: ${STATUS_F1}, ${STATUS_F2}"
fi

# ============================================================
# Test W3: Free tier via waiver accept (HHH 15mi = $0)
# ============================================================
printf "\n${BOLD}[W3] Free tier — HHH 15mi via waiver accept API${NC}\n"
# Insert a free registration directly (simulates what /api/waiver/accept does)
REG_FREE_ID=$(sb_insert "registrations" "$(cat <<EOF
{
  "org_id": "${MMM_ORG_ID}",
  "event_id": "${HHH_EVENT_ID}",
  "distance": "15 miles",
  "amount": 0,
  "status": "free",
  "waiver_accepted": true,
  "waiver_accepted_at": "2026-03-01T12:00:00.000Z",
  "waiver_ip": "127.0.0.1",
  "waiver_user_agent": "smoke-test/1.0",
  "waiver_version": "2026-v1",
  "waiver_text_hash": "dbfb5e75819beb734c99a112afcca00d402fceff1c921f0c7adb977fb8c7f2be",
  "waiver_snapshot_text": "smoke-test waiver snapshot",
  "participant_name": "Free Rider",
  "participant_email": "free15@test.com",
  "emergency_contact_name": "Free EC",
  "emergency_contact_phone": "555-000-FREE",
  "email": "free15@test.com"
}
EOF
)" | jq -r '.[0].id // empty')
CLEANUP_REG_IDS+=("$REG_FREE_ID")

if [ -n "$REG_FREE_ID" ]; then
  REG_FREE=$(sb_query "registrations" "select=status,amount,waiver_accepted,waiver_version&id=eq.${REG_FREE_ID}" | jq '.[0]')
  REG_FREE_STATUS=$(echo "$REG_FREE" | jq -r '.status // empty')
  REG_FREE_AMT=$(echo "$REG_FREE" | jq -r '.amount // 0')
  REG_FREE_WAIVER=$(echo "$REG_FREE" | jq -r '.waiver_accepted // false')
  REG_FREE_WVER=$(echo "$REG_FREE" | jq -r '.waiver_version // empty')

  if [ "$REG_FREE_STATUS" = "free" ] && [ "$REG_FREE_AMT" = "0" ] && [ "$REG_FREE_WAIVER" = "true" ] && [ "$REG_FREE_WVER" = "2026-v1" ]; then
    pass "W3: Free tier registration (amount=0, waiver OK, version=2026-v1)"
  else
    fail "W3: Free tier" "status=${REG_FREE_STATUS}, amt=${REG_FREE_AMT}, waiver=${REG_FREE_WAIVER}, ver=${REG_FREE_WVER}"
  fi
else
  fail "W3: Free tier" "failed to insert registration"
fi

# ============================================================
# Test W4: Free tier + referral — NO credit created
# ============================================================
printf "\n${BOLD}[W4] Free + referral — no credit${NC}\n"
REG_FREEREF_ID=$(sb_insert "registrations" "$(cat <<EOF
{
  "org_id": "${MMM_ORG_ID}",
  "event_id": "${HHH_EVENT_ID}",
  "distance": "15 miles",
  "amount": 0,
  "status": "free",
  "waiver_accepted": true,
  "waiver_accepted_at": "2026-03-01T12:00:00.000Z",
  "waiver_ip": "127.0.0.1",
  "waiver_user_agent": "smoke-test/1.0",
  "waiver_version": "2026-v1",
  "waiver_snapshot_text": "smoke-test waiver snapshot",
  "participant_name": "Free Ref Rider",
  "participant_email": "freeref@test.com",
  "emergency_contact_name": "FreeRef EC",
  "emergency_contact_phone": "555-000-FREF",
  "referral_code": "FREE_REF_CODE",
  "email": "freeref@test.com"
}
EOF
)" | jq -r '.[0].id // empty')
CLEANUP_REG_IDS+=("$REG_FREEREF_ID")

if [ -n "$REG_FREEREF_ID" ]; then
  CREDIT_FREEREF_COUNT=$(sb_query "referral_credits" "select=id&registration_id=eq.${REG_FREEREF_ID}" | jq 'length')
  if [ "$CREDIT_FREEREF_COUNT" = "0" ]; then
    pass "W4: No referral credit for free registration"
  else
    fail "W4: Free referral guard" "expected 0 credits, got ${CREDIT_FREEREF_COUNT}"
  fi
else
  fail "W4: Free+referral" "failed to insert"
fi

# ============================================================
# Test W5: Webhook refuses paid if waiver_accepted=false
# ============================================================
printf "\n${BOLD}[W5] Webhook refuses paid with waiver_accepted=false${NC}\n"
CS_W5="cs_smoke_w5_${RUN_TAG}"
PI_W5="pi_smoke_w5_${RUN_TAG}"
REG_W5_ID=$(create_pending_reg "$MMM_ORG_ID" "$HHH_EVENT_ID" "30 miles" 4899 "false")

PAYLOAD_W5=$(build_checkout_event_v2 "evt_smoke_w5_${RUN_TAG}" "$CS_W5" "$PI_W5" \
  "$MMM_ORG_ID" "$HHH_EVENT_ID" "30 miles" 4899 "$REG_W5_ID")

STATUS_W5=$(fire_webhook "$PAYLOAD_W5")
if [ "$STATUS_W5" = "400" ]; then
  REG_W5_STATUS=$(sb_query "registrations" "select=status&id=eq.${REG_W5_ID}" | jq -r '.[0].status // empty')
  if [ "$REG_W5_STATUS" = "pending" ]; then
    pass "W5: Webhook returns 400, registration stays pending"
  else
    fail "W5: Webhook waiver guard" "webhook 400 but status=${REG_W5_STATUS}"
  fi
else
  fail "W5: Webhook waiver guard" "expected 400, got ${STATUS_W5}"
fi

# ============================================================
# Test W6: Verify emergency contact + snapshot fields populated
# ============================================================
printf "\n${BOLD}[W6] Emergency contact + waiver snapshot fields populated${NC}\n"
REG_W6_ID=$(create_pending_reg "$MMM_ORG_ID" "$HHH_EVENT_ID" "30 miles" 4899 "true" "" "w6@test.com")

if [ -n "$REG_W6_ID" ]; then
  REG_W6=$(sb_query "registrations" "select=participant_name,participant_email,emergency_contact_name,emergency_contact_phone,waiver_snapshot_text&id=eq.${REG_W6_ID}" | jq '.[0]')
  W6_PNAME=$(echo "$REG_W6" | jq -r '.participant_name // empty')
  W6_PEMAIL=$(echo "$REG_W6" | jq -r '.participant_email // empty')
  W6_ECNAME=$(echo "$REG_W6" | jq -r '.emergency_contact_name // empty')
  W6_ECPHONE=$(echo "$REG_W6" | jq -r '.emergency_contact_phone // empty')
  W6_SNAPSHOT=$(echo "$REG_W6" | jq -r '.waiver_snapshot_text // empty')

  W6_OK=true
  if [ -z "$W6_PNAME" ] || [ -z "$W6_PEMAIL" ]; then
    fail "W6: Participant fields" "name=${W6_PNAME}, email=${W6_PEMAIL}"
    W6_OK=false
  fi
  if [ -z "$W6_ECNAME" ] || [ -z "$W6_ECPHONE" ]; then
    fail "W6: Emergency contact fields" "ec_name=${W6_ECNAME}, ec_phone=${W6_ECPHONE}"
    W6_OK=false
  fi
  if [ -z "$W6_SNAPSHOT" ]; then
    fail "W6: Waiver snapshot" "waiver_snapshot_text is empty"
    W6_OK=false
  fi
  if [ "$W6_OK" = "true" ]; then
    pass "W6: Emergency contact + waiver snapshot fields populated"
  fi
else
  fail "W6: Setup" "failed to create registration"
fi

# ============================================================
# Test G: Refund — charge.refunded
# ============================================================
printf "\n${BOLD}[G] Refund — charge.refunded for test E's payment${NC}\n"
REFUND_PAYLOAD=$(build_refund_event "evt_smoke_refund_${RUN_TAG}" "ch_smoke_${RUN_TAG}" "$PI_E" 6499)

STATUS_G=$(fire_webhook "$REFUND_PAYLOAD")
if [ "$STATUS_G" = "200" ]; then
  sleep 0.5
  REG_G_STATUS=$(sb_query "registrations" "select=status&id=eq.${REG_E_ID}" | jq -r '.[0].status // empty')
  CREDIT_G_VOIDED=$(sb_query "referral_credits" "select=voided&registration_id=eq.${REG_E_ID}" | jq -r '.[0].voided // empty')

  REFUND_OK=true
  if [ "$REG_G_STATUS" != "refunded" ]; then
    fail "G: Refund status" "expected refunded, got ${REG_G_STATUS}"
    REFUND_OK=false
  fi
  if [ "$CREDIT_G_VOIDED" != "true" ]; then
    fail "G: Credit void" "expected voided=true, got ${CREDIT_G_VOIDED}"
    REFUND_OK=false
  fi
  if [ "$REFUND_OK" = "true" ]; then
    pass "G: Refund → registration=refunded, credit=voided"
  fi
else
  fail "G: Refund" "webhook returned HTTP ${STATUS_G}"
fi

# ============================================================
# Test H: Unhandled event type — 200 ack
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
# Test L: Legacy webhook (backward compat — no registration_id)
# ============================================================
printf "\n${BOLD}[L] Legacy webhook — no registration_id in metadata${NC}\n"
CS_L="cs_smoke_legacy_${RUN_TAG}"
PI_L="pi_smoke_legacy_${RUN_TAG}"
PAYLOAD_L=$(build_checkout_event_legacy "evt_smoke_legacy_${RUN_TAG}" "$CS_L" "$PI_L" \
  "$MMM_ORG_ID" "$HHH_EVENT_ID" "30 miles" 4899 "" "legacy@test.com")

STATUS_L=$(fire_webhook "$PAYLOAD_L")
if [ "$STATUS_L" = "200" ]; then
  sleep 0.5
  REG_L_STATUS=$(sb_query "registrations" "select=status&stripe_session_id=eq.${CS_L}" | jq -r '.[0].status // empty')
  if [ "$REG_L_STATUS" = "paid" ]; then
    REG_L_ID=$(sb_query "registrations" "select=id&stripe_session_id=eq.${CS_L}" | jq -r '.[0].id // empty')
    CLEANUP_REG_IDS+=("$REG_L_ID")
    pass "L: Legacy webhook creates paid registration"
  else
    fail "L: Legacy webhook" "status=${REG_L_STATUS}"
  fi
else
  fail "L: Legacy webhook" "HTTP ${STATUS_L}"
fi

# ============================================================
# Test I1: HHH early bonus — before deadline → 5 main tickets + socks perk
# ============================================================
printf "\n${BOLD}[I1] HHH early bonus — before deadline (backdated created_at)${NC}\n"
# Insert registration with created_at explicitly before the HHH deadline (2026-06-01T03:59:59Z)
# We insert with a backdated timestamp so applyEarlyBonusForRegistration sees it as in-window.
REG_I1_ID=$(sb_insert "registrations" "$(cat <<EOF
{
  "org_id": "${MMM_ORG_ID}",
  "event_id": "${HHH_EVENT_ID}",
  "user_id": null,
  "distance": "62 miles",
  "amount": 6499,
  "status": "paid",
  "waiver_accepted": true,
  "waiver_accepted_at": "2026-01-15T12:00:00.000Z",
  "waiver_ip": "127.0.0.1",
  "waiver_user_agent": "smoke-test/1.0",
  "waiver_version": "2026-v1",
  "waiver_text_hash": "dbfb5e75819beb734c99a112afcca00d402fceff1c921f0c7adb977fb8c7f2be",
  "waiver_snapshot_text": "smoke-test waiver snapshot",
  "participant_name": "Early HHH Rider",
  "participant_email": "hhhearly@test.com",
  "emergency_contact_name": "HHH EC",
  "emergency_contact_phone": "555-000-HHH",
  "created_at": "2026-01-15T12:00:00.000Z"
}
EOF
)" | jq -r '.[0].id // empty')
CLEANUP_REG_IDS+=("$REG_I1_ID")

if [ -n "$REG_I1_ID" ]; then
  # Directly invoke the incentive engine via the internal test helper endpoint
  INCENTIVE_URL="http://localhost:3001/api/test/apply-early-bonus"
  I1_RESP=$(curl -s -w "\n%{http_code}" -X POST "$INCENTIVE_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${CRON_SECRET:-}" \
    -d "{\"registration_id\": \"${REG_I1_ID}\"}")
  I1_HTTP=$(echo "$I1_RESP" | tail -1)

  if [ "$I1_HTTP" = "200" ]; then
    sleep 0.5
    # Check raffle entries: source_id=early_bonus:{REG_I1_ID}
    I1_SOURCE_ID="early_bonus:${REG_I1_ID}"
    I1_ENTRY=$(sb_query "raffle_entries" "select=tickets_count,source&source_id=eq.${I1_SOURCE_ID}" | jq '.[0]')
    I1_TICKETS=$(echo "$I1_ENTRY" | jq -r '.tickets_count // 0')
    I1_SOURCE=$(echo "$I1_ENTRY" | jq -r '.source // empty')

    # Check merch perk on registration
    I1_PERK=$(sb_query "registrations" "select=early_merch_perk&id=eq.${REG_I1_ID}" | jq -r '.[0].early_merch_perk // []')
    I1_HAS_SOCKS=$(echo "$I1_PERK" | jq -r 'map(select(. == "hhh_socks_2026")) | length')

    I1_OK=true
    if [ "$I1_SOURCE" != "early_bonus" ] || [ "$I1_TICKETS" = "0" ]; then
      fail "I1: HHH early bonus — raffle entry" "source=${I1_SOURCE}, tickets=${I1_TICKETS}"
      I1_OK=false
    fi
    if [ "$I1_HAS_SOCKS" != "1" ]; then
      fail "I1: HHH early bonus — socks perk" "early_merch_perk=${I1_PERK}"
      I1_OK=false
    fi
    if [ "$I1_OK" = "true" ]; then
      pass "I1: HHH early bonus — ${I1_TICKETS} bonus tickets + socks perk"
    fi

    # ============================================================
    # Test I2: Idempotency — rerun early bonus, no duplicate entries
    # ============================================================
    printf "\n${BOLD}[I2] Early bonus idempotency — rerun doesn't add more tickets${NC}\n"
    curl -s -o /dev/null -X POST "$INCENTIVE_URL" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${CRON_SECRET:-}" \
      -d "{\"registration_id\": \"${REG_I1_ID}\"}"
    sleep 0.3
    curl -s -o /dev/null -X POST "$INCENTIVE_URL" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${CRON_SECRET:-}" \
      -d "{\"registration_id\": \"${REG_I1_ID}\"}"
    sleep 0.5

    I2_COUNT=$(sb_query "raffle_entries" "select=id&source_id=eq.${I1_SOURCE_ID}" | jq 'length')
    I2_PERK=$(sb_query "registrations" "select=early_merch_perk&id=eq.${REG_I1_ID}" | jq -r '.[0].early_merch_perk // []')
    I2_SOCKS_COUNT=$(echo "$I2_PERK" | jq -r 'map(select(. == "hhh_socks_2026")) | length')

    if [ "$I2_COUNT" = "1" ] && [ "$I2_SOCKS_COUNT" = "1" ]; then
      pass "I2: Early bonus idempotent — still 1 entry, 1 socks perk after 3 runs"
    else
      fail "I2: Early bonus idempotency" "entries=${I2_COUNT}, socks_count=${I2_SOCKS_COUNT}"
    fi
  else
    fail "I1: HHH early bonus" "test helper returned HTTP ${I1_HTTP}"
    printf "  ${YELLOW}Note: ensure CRON_SECRET is set in .env.local and dev server is running${NC}\n"
  fi
else
  fail "I1: Setup" "failed to insert HHH registration"
fi

# ============================================================
# Test I3: FFF early bonus — before deadline → +1 main ticket
# ============================================================
printf "\n${BOLD}[I3] FFF early bonus — before deadline${NC}\n"
if [ -n "$FFF_EVENT" ]; then
  REG_I3_ID=$(sb_insert "registrations" "$(cat <<EOF
{
  "org_id": "${MMM_ORG_ID}",
  "event_id": "${FFF_EVENT}",
  "user_id": null,
  "distance": "50 miles",
  "amount": 3500,
  "status": "paid",
  "waiver_accepted": true,
  "waiver_accepted_at": "2026-01-10T08:00:00.000Z",
  "waiver_ip": "127.0.0.1",
  "waiver_user_agent": "smoke-test/1.0",
  "waiver_version": "2026-v1",
  "waiver_text_hash": "dbfb5e75819beb734c99a112afcca00d402fceff1c921f0c7adb977fb8c7f2be",
  "waiver_snapshot_text": "smoke-test waiver snapshot",
  "participant_name": "Early FFF Rider",
  "participant_email": "fffearly@test.com",
  "emergency_contact_name": "FFF EC",
  "emergency_contact_phone": "555-000-FFF",
  "created_at": "2026-01-10T08:00:00.000Z"
}
EOF
)" | jq -r '.[0].id // empty')
  CLEANUP_REG_IDS+=("$REG_I3_ID")

  if [ -n "$REG_I3_ID" ]; then
    INCENTIVE_URL="http://localhost:3001/api/test/apply-early-bonus"
    I3_RESP=$(curl -s -w "\n%{http_code}" -X POST "$INCENTIVE_URL" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${CRON_SECRET:-}" \
      -d "{\"registration_id\": \"${REG_I3_ID}\"}")
    I3_HTTP=$(echo "$I3_RESP" | tail -1)

    if [ "$I3_HTTP" = "200" ]; then
      sleep 0.5
      I3_SOURCE_ID="early_bonus:${REG_I3_ID}"
      I3_ENTRY=$(sb_query "raffle_entries" "select=tickets_count,source&source_id=eq.${I3_SOURCE_ID}" | jq '.[0]')
      I3_TICKETS=$(echo "$I3_ENTRY" | jq -r '.tickets_count // 0')
      I3_SOURCE=$(echo "$I3_ENTRY" | jq -r '.source // empty')

      # FFF should have no merch perk
      I3_PERK=$(sb_query "registrations" "select=early_merch_perk&id=eq.${REG_I3_ID}" | jq -r '.[0].early_merch_perk // []')
      I3_PERK_COUNT=$(echo "$I3_PERK" | jq 'length')

      I3_OK=true
      if [ "$I3_SOURCE" != "early_bonus" ] || [ "$I3_TICKETS" = "0" ]; then
        fail "I3: FFF early bonus — raffle entry" "source=${I3_SOURCE}, tickets=${I3_TICKETS}"
        I3_OK=false
      fi
      if [ "$I3_PERK_COUNT" != "0" ]; then
        fail "I3: FFF early bonus — no merch perk expected" "early_merch_perk=${I3_PERK}"
        I3_OK=false
      fi
      if [ "$I3_OK" = "true" ]; then
        pass "I3: FFF early bonus — ${I3_TICKETS} bonus ticket(s), no merch perk"
      fi
    else
      fail "I3: FFF early bonus" "test helper returned HTTP ${I3_HTTP}"
    fi
  else
    fail "I3: Setup" "failed to insert FFF registration"
  fi
else
  fail "I3: FFF early bonus" "FFF event not found"
fi

# ============================================================
# Test I4: HHH after deadline — no bonus
# ============================================================
printf "\n${BOLD}[I4] HHH after deadline — no early bonus${NC}\n"
# created_at after 2026-06-01T03:59:59Z
REG_I4_ID=$(sb_insert "registrations" "$(cat <<EOF
{
  "org_id": "${MMM_ORG_ID}",
  "event_id": "${HHH_EVENT_ID}",
  "user_id": null,
  "distance": "30 miles",
  "amount": 4899,
  "status": "paid",
  "waiver_accepted": true,
  "waiver_accepted_at": "2026-07-01T12:00:00.000Z",
  "waiver_ip": "127.0.0.1",
  "waiver_user_agent": "smoke-test/1.0",
  "waiver_version": "2026-v1",
  "waiver_text_hash": "dbfb5e75819beb734c99a112afcca00d402fceff1c921f0c7adb977fb8c7f2be",
  "waiver_snapshot_text": "smoke-test waiver snapshot",
  "participant_name": "Late HHH Rider",
  "participant_email": "hhhlate@test.com",
  "emergency_contact_name": "Late EC",
  "emergency_contact_phone": "555-000-LATE",
  "created_at": "2026-07-01T12:00:00.000Z"
}
EOF
)" | jq -r '.[0].id // empty')
CLEANUP_REG_IDS+=("$REG_I4_ID")

if [ -n "$REG_I4_ID" ]; then
  INCENTIVE_URL="http://localhost:3001/api/test/apply-early-bonus"
  curl -s -o /dev/null -X POST "$INCENTIVE_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${CRON_SECRET:-}" \
    -d "{\"registration_id\": \"${REG_I4_ID}\"}"
  sleep 0.5

  I4_SOURCE_ID="early_bonus:${REG_I4_ID}"
  I4_COUNT=$(sb_query "raffle_entries" "select=id&source_id=eq.${I4_SOURCE_ID}" | jq 'length')
  I4_PERK=$(sb_query "registrations" "select=early_merch_perk&id=eq.${REG_I4_ID}" | jq -r '.[0].early_merch_perk // []')
  I4_PERK_COUNT=$(echo "$I4_PERK" | jq 'length')

  if [ "$I4_COUNT" = "0" ] && [ "$I4_PERK_COUNT" = "0" ]; then
    pass "I4: HHH after deadline — no bonus tickets, no perk"
  else
    fail "I4: HHH deadline guard" "entries=${I4_COUNT}, perks=${I4_PERK}"
  fi
else
  fail "I4: Setup" "failed to insert late HHH registration"
fi

# ============================================================
# Cleanup
# ============================================================
printf "\n${BOLD}Cleaning up smoke-test data…${NC}\n"
for REG_ID in "${CLEANUP_REG_IDS[@]}"; do
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
printf "  %-6s %-54s %s\n" "Result" "Test" "Detail"
printf "  %-6s %-54s %s\n" "------" "------------------------------------------------------" "------"
for entry in "${RESULTS[@]}"; do
  IFS='|' read -r result name detail <<< "$entry"
  if [ "$result" = "PASS" ]; then
    printf "  ${GREEN}%-6s${NC} %-54s\n" "PASS" "$name"
  else
    printf "  ${RED}%-6s${NC} %-54s %s\n" "FAIL" "$name" "$detail"
  fi
done
printf "${BOLD}═══════════════════════════════════════════${NC}\n"
printf "  Total: ${TOTAL}   ${GREEN}Pass: ${PASS}${NC}   ${RED}Fail: ${FAIL}${NC}\n"
printf "${BOLD}═══════════════════════════════════════════${NC}\n\n"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
