# Booking, payment and contact enquiry emails

All email code runs in Supabase Edge Functions. The website does not call Resend
and does not need any private email or payment credentials in Netlify.

## Contact form

The existing contact form saves to `contact_enquiries`. An insert trigger queues
one admin notification in `contact_email_outbox` in the same transaction and
nudges the private `process-booking-emails` Edge Function. The existing minute
schedule also retries contact notifications. No new public email endpoint or
private frontend credentials are needed, and existing deployed forms work too.

Notifications use `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL`, `EMAIL_SITE_URL` and
`RESEND_API_KEY`, the same secrets as booking emails. Only the admin is emailed.
The submitted email is set as `reply_to`; the message includes the name, email,
optional phone, subject, message, received time and admin enquiry link. Submitted
HTML is escaped, and the verified KMGMT sender is never replaced by visitor input.

Each job has a database lease, stable Resend idempotency key, frozen request and
saved provider receipt. Failed deliveries retry with backoff and ambiguous sends
older than 23 hours need manual reconciliation. Inspect the service-only
`contact_email_outbox` for `status`, `attempts`, `last_error_code` and `resend_id`.
The public form and signed-in clients cannot read or modify this delivery table.

Existing enquiries are not backfilled. New submissions are limited to five per
email address in 15 minutes; this is a basic throttle, not a substitute for a
bot challenge if the public form later receives sustained abuse. Changing an
enquiry's read/responded/archived status does not send another notification.

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

| Secret                     | Purpose                                                                           |
| -------------------------- | --------------------------------------------------------------------------------- |
| `RESEND_API_KEY`           | Existing Resend API key with sending permission for the verified domain           |
| `EMAIL_FROM`               | Sender, e.g. `KMGMT <bookings@kmgmt.co.za>`                                       |
| `ADMIN_NOTIFICATION_EMAIL` | Current admin recipient; change this secret to change future notifications        |
| `EMAIL_SITE_URL`           | `https://kmgmt.co.za` for booking/admin links                                     |
| `EMAIL_WHATSAPP`           | Public KMGMT WhatsApp number for session arrangements, changes and manual refunds |
| `EMAIL_WORKER_TOKEN`       | Random private token shared with Vault's `booking_email_worker_token`             |

Set these with the Supabase secrets UI/CLI. Never add them to `VITE_*` variables.
The admin address is stored in Supabase secrets rather than application source.
New website bookings are automatically saved as `online`, using the same hold
RPC, availability rules, five booking steps and payment flow. The format is
included in email snapshots. Historical `in_person` and unspecified records
remain supported; the public site offers no in-person selector. Only Kieraan
may personally confirm an exception through WhatsApp, and website booking and
payment are still required. No consultation address is published. Kieraan arranges
the video call directly before the session; the website does not create video
meetings or issue refunds automatically.
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
