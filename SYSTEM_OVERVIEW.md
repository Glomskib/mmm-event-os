# MMM Event OS — System Overview

## Architecture

**Stack:** Next.js 16 (React 19) + Supabase (Postgres, Auth, Storage) + Stripe + Resend + Vercel

```
Browser → Next.js (Vercel) → Supabase (DB + Auth + Storage)
                           → Stripe (Payments)
                           → Resend (Transactional Email)
```

**Key Patterns:**
- Server Components (default) with Client Components for interactivity
- Server Actions for mutations
- Row-Level Security (RLS) on all tables
- Service-role admin client (`createAdminClient()`) for server-only operations
- Middleware for session refresh and auth redirects

---

## Data Flow

### Registration → Waiver → Stripe → Webhook → Referral

1. **User selects event + distance** (`/events` → `/waiver`)
2. **Waiver acceptance** creates a `registrations` row (status=`pending`)
   - POST `/api/waiver/accept` → inserts registration, generates waiver PDF, sends waiver email
3. **Stripe checkout** (if paid distance):
   - POST `/api/stripe/checkout` → creates Stripe checkout session
   - Idempotency guard prevents duplicate paid registrations
4. **Stripe webhook** (`/api/stripe/webhook`):
   - `checkout.session.completed` → updates registration status to `paid`
   - Creates `referral_credits` row if referral code present
5. **Referral milestones** (cron):
   - Checks leaderboard, awards milestone tiers, creates raffle entries

### Check-in → Moderation → Raffle

1. User uploads photo at `/checkin` → stored in Supabase Storage
2. Admin reviews at `/admin/checkins` → approve or reject
3. Approval creates a `raffle_entries` row (source=`shop_ride`)

### Welcome Email

- Triggered on first login via auth callback (fire-and-forget)
- Idempotent via `welcome_email_sent_at` column
- Controlled by `WELCOME_EMAIL_ENABLED` env var

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `orgs` | Multi-tenant organizations |
| `profiles` | User profiles (linked to Supabase Auth) |
| `events` | Events (rides, fundraisers) |
| `registrations` | Event registrations with waiver + payment state |
| `ride_series` | Recurring ride templates |
| `ride_occurrences` | Individual ride dates |
| `checkins` | Ride check-in photos with approval flow |
| `raffle_entries` | Raffle tickets from rides, referrals, bonuses |
| `referral_codes` | Per-user referral codes |
| `referral_credits` | Credit records linking registrations to referrers |
| `referral_rewards` | Milestone tier unlocks |
| `system_logs` | Cron execution and email send logs |
| `approvals` | Content approval queue (emails, social posts) |

**Views:** `referral_leaderboard_v` — aggregated referral rankings

---

## Cron Jobs

| Route | Schedule | Purpose |
|-------|----------|---------|
| `/api/cron/weekly-ride-email` | Mondays 1pm UTC | Send weekly ride schedule (or create draft if approval mode) |
| `/api/cron/referral-weekly-email` | Mondays midnight UTC | Send personalized referral stats + run milestone check |
| `/api/cron/referral-milestones` | On-demand / manual | Check and award referral milestone tiers + raffle tickets |

All cron routes are protected by `CRON_SECRET` Bearer token.

**Testing crons locally:**
```bash
curl -s -X POST 'http://localhost:3001/api/cron/weekly-ride-email?test=true' \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `RESEND_API_KEY` | Yes | Resend email API key |
| `RESEND_FROM` | Yes | Email from address (e.g., `Miles <miles@makingmilesmatter.com>`) |
| `MMM_ADMIN_EMAIL` | Yes | Admin notification email |
| `CRON_SECRET` | Yes | Bearer token for cron route auth |
| `NEXT_PUBLIC_APP_URL` | Yes | App base URL (e.g., `http://localhost:3001`) |
| `WELCOME_EMAIL_ENABLED` | No | Set to `false` to disable welcome emails |
| `WEEKLY_RIDE_EMAIL_APPROVAL_MODE` | No | Set to `true` to create drafts instead of sending immediately |

---

## Migration Order

Migrations must be applied sequentially:

```
00001_initial_schema.sql
00002_registrations_and_referrals.sql
00003_fix_rls_recursion.sql
00004_fix_profiles_rls_final.sql
00005_add_waiver_fields.sql
00006_add_waiver_text_hash.sql
00007_waiver_signature_and_emergency_contact.sql
00008_referral_codes_and_leaderboard.sql
00009_checkin_approval_and_raffle.sql
00010_raffle_pools_and_referral_tickets.sql
00011_weekly_ride_email_fields.sql
00012_event_day_flags.sql
00013_profile_welcome_email_sent.sql
00014_system_logs.sql
00015_approval_queue.sql
```

**Apply all:** `supabase db reset` (local) or apply individually via Supabase dashboard.

---

## Deployment Checklist

1. Ensure all environment variables are set on Vercel (production + preview)
2. Apply any new migrations to the Supabase database
3. Verify `vercel.json` cron schedules are correct
4. Run `npm run build` locally to confirm no type errors
5. Push to `main` → Vercel auto-deploys
6. After deploy:
   - Check `/admin/system` health dashboard for env var status
   - Run a test cron call to verify email delivery
   - Verify Stripe webhook is receiving events (Stripe dashboard)

---

## Event Day Playbook

### Before the Event
1. Verify all registrations at `/admin/event-day`
2. Ensure waivers are signed (check "Missing" badges)
3. Download emergency contacts CSV from `/admin/exports`
4. Print event bundle ZIP if needed

### During the Event
1. Use `/admin/event-day` to:
   - Search participants by name
   - Mark bibs as issued (checkbox)
   - Flag emergencies (red button)
2. Direct riders to `/checkin` for photo check-in
3. Monitor participant count in real-time

### After the Event
1. Review check-in photos at `/admin/checkins`
   - Approve valid photos → creates raffle entries
   - Reject invalid photos
2. Run raffle draw at `/admin/raffles`
   - Export CSV for each pool (referral / main)
3. Check analytics at `/admin/analytics` for revenue summary

---

## Admin Pages

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/admin` | Hub with links to all sections |
| Events | `/admin/events` | Event CRUD |
| Rides | `/admin/rides` | Ride series and occurrence management |
| Members | `/admin/members` | Org member management |
| Check-ins | `/admin/checkins` | Photo moderation (approve/reject) |
| Referrals | `/admin/referrals` | Leaderboard + milestone tracking |
| Raffles | `/admin/raffles` | Raffle pools by source (referral/main) |
| Analytics | `/admin/analytics` | Revenue, registrations, conversion metrics |
| Event Day | `/admin/event-day` | Day-of operations command center |
| Approvals | `/admin/approvals` | Review + approve emails before sending |
| Email | `/admin/email` | Weekly ride email controls |
| Exports | `/admin/exports` | CSV + ZIP downloads |
| System | `/admin/system` | Health checks, env status, execution logs |

All admin pages require `role = 'admin'` (enforced by admin layout guard).

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/supabase/admin.ts` | Service-role Supabase client |
| `src/lib/supabase/server.ts` | Auth-aware server Supabase client |
| `src/lib/org.ts` | Org + profile resolution |
| `src/lib/pricing.ts` | Event pricing rules |
| `src/lib/referrals.ts` | Milestone tiers and ticket awards |
| `src/lib/resend.ts` | Email sending with retry logic |
| `src/lib/logger.ts` | Structured logging + system_logs writer |
| `src/lib/require-admin.ts` | Admin role guard for routes |
| `src/lib/validators.ts` | Input validation helpers |
| `src/lib/stripe.ts` | Stripe client instance |
| `src/lib/waiver-pdf.ts` | PDF generation for waivers |
