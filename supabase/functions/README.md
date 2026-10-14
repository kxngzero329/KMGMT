# Booking and payment emails

All email code runs in Supabase Edge Functions. The website does not call Resend
and does not need any private email or payment credentials in Netlify.

## Flow

1. `payfast-notify` verifies the signature, merchant, PayFast validation response,
   payment amount and provider reference before recording the payment.
2. Confirming a paid booking atomically inserts separate customer/admin jobs into
   `booking_email_outbox`. A unique payment/kind constraint prevents duplicate jobs.
3. The notification function nudges the email worker in the background. The
   `kmgmt-booking-email-retries` cron job invokes `process-booking-emails` every
   minute while work is due. Provider failures do not reverse a successful payment.
4. Database leases prevent overlapping workers from claiming the same job. Each
   job stores its exact Resend request and uses its UUID as an idempotency key.
5. Provider acceptance is recorded with the Resend email ID. Delivery to the inbox
   is tracked in Resend; the local `sent` state means Resend accepted the message.

Only confirmed, paid bookings receive customer confirmations. Paid slot conflicts
produce an admin attention-required email. Cancellation/refund before delivery
stops pending confirmations. Existing historical bookings are not backfilled.

## Supabase Edge Function secrets

| Secret | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Existing Resend API key with sending permission for the verified domain |
| `EMAIL_FROM` | Sender, e.g. `KMGMT <bookings@kmgmt.co.za>` |
| `ADMIN_NOTIFICATION_EMAIL` | Current admin recipient; change this secret to change future notifications |
| `EMAIL_SITE_URL` | `https://kmgmt.co.za` for booking/admin links |
| `EMAIL_WORKER_TOKEN` | Random private token shared with Vault's `booking_email_worker_token` |

Set these with the Supabase secrets UI/CLI. Never add them to `VITE_*` variables.
The admin address is stored in Supabase secrets rather than application source.
Jobs whose first send was already attempted keep their original recipient/payload
to preserve Resend idempotency. Future unattempted jobs use the new secret.

## Operations

Use the Supabase SQL editor or a privileged database connection to inspect
`booking_email_outbox`: `status`, `attempts`, `last_error_code`, `resend_id`, and
`sent_at` show delivery progress. The table and all delivery RPCs are inaccessible
to anonymous and authenticated browser clients. Payloads contain client details;
do not publish them or copy them to frontend logs.

Transient failures retry with backoff. Invalid requests and ambiguous sends older
than 23 hours move to `manual_review`; reconcile their Resend status before any
manual requeue. Resend's idempotency window is 24 hours, so automatic retries stop
before that expires. Keep payloads unchanged when retrying.

The private worker accepts POST `{}` with the `x-email-worker-token` header.
POST `{"test":true}` sends labelled customer/admin sample templates only to
`ADMIN_NOTIFICATION_EMAIL`, with no bookings created and no payments taken.
The endpoint rejects arbitrary recipients. The cron token lives encrypted in
Supabase Vault and is not included in the cron command or website bundle.

Checks: `npm test`, `npx tsc --noEmit`, and
`supabase db query --linked --file supabase/tests/booking-email-outbox.sql`.
The SQL checks roll back every test record and never send an email.
