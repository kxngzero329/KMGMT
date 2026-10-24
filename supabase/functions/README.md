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

## EFT bookings and invoices

The website has six steps: consultation, client details, date, time, payment
method and review. EFT is available; PayFast is visible but disabled while
merchant verification is pending. New bookings are still online consultations.

`create-eft-booking` validates the project key, allowed website origin and client
details, then calls the service-only `create_eft_booking` RPC. The SQL booking
engine checks availability, guardian consent and the service price. The browser
cannot choose an amount. An idempotent request UUID prevents duplicate bookings
on retries. Up to three unpaid EFT reservations are allowed per client email.

An EFT booking reserves the selected slot (`bookings.status = confirmed`) while
its payment remains `pending`. Its hold expiry is cleared so it does not disappear
after the short PayFast checkout hold. Reservation and payment are separate;
the customer screen and invoice explicitly say that funds have not been verified.
Unpaid EFT reservations require manual follow-up or cancellation by an admin.

The transaction assigns a unique invoice number and queues a customer confirmation
and full admin notification in the service-only `eft_email_outbox`. The private
`process-eft-emails` function generates a branded PDF invoice with server-side
`pdf-lib` and sends both messages through Resend. Bank details exist only in Edge
secrets and private email payloads/attachments; there is no public invoice URL,
bucket, bank table or account-details API response. The existing PayFast email
templates, notification handler and email worker are unchanged.

The customer EFT email and status page include WhatsApp and email proof-of-payment buttons.
These open the chosen app with the reference filled in; clients must attach the
proof themselves. They do not upload proof to Supabase or automatically verify
payment. The proof email recipient is Kieraan's public contact address, separate
from the temporary admin notification recipient in `ADMIN_NOTIFICATION_EMAIL`.

Admin EFT emails contain booking, payment and client details with a **View in your
dashboard** link. Customer payment instructions, bank details, proof buttons,
session-arrangement paragraphs and the customer invoice attachment are omitted
from admin notifications. The customer confirmation email and PDF are unchanged.
Previously frozen delivery payloads keep their original content for safe retries.

The admin booking list, dashboard, booking details and payment list show the
selected method. After checking that the full amount arrived in the bank account,
an admin can select **Mark EFT received**. The `verify_eft_payment` RPC checks
`is_admin()`, requires a reserved/completed EFT booking with a pending payment,
and records the paid timestamp and verifying admin. It never marks a PayFast
payment paid and does not send or alter PayFast confirmation emails.

The EFT worker uses database leases, frozen requests, stable Resend idempotency
keys and saved delivery receipts. It is nudged on booking creation and retried
every minute by `kmgmt-eft-email-retries`. Pending invoice jobs are stopped for
closed bookings or changed payments. Inspect `eft_email_outbox` through a
privileged connection for delivery failures or `manual_review`; reconcile Resend
before requeuing an ambiguous delivery. The worker accepts only a private-token
POST `{}`, with no arbitrary recipient or sample-email mode.

Additional Supabase Edge secrets (never put these in Netlify or `VITE_*`):

| Secret                     | Purpose                                                      |
| -------------------------- | ------------------------------------------------------------ |
| `EFT_BANK_NAME`            | Bank name for private email invoices                         |
| `EFT_ACCOUNT_HOLDER`       | Account holder for private email invoices                    |
| `EFT_ACCOUNT_NUMBER`       | Account number for private email invoices                    |
| `EFT_ACCOUNT_TYPE`         | Account type for private email invoices                      |
| `EFT_PROOF_EMAIL`          | Public email address that receives clients' proof of payment |
| `PAYFAST_CHECKOUT_ENABLED` | Set to `false` while merchant verification is pending        |

EFT also uses the existing email sender, admin recipient, Resend key, site URL,
WhatsApp number and `EMAIL_WORKER_TOKEN`. The same worker token is read from Vault
under `booking_email_worker_token` for the scheduled invocation. Rotate the Edge
secret and Vault entry together.

Deploy the migration, regenerate database types and deploy `create-eft-booking`,
`process-eft-emails` and `create-payfast-payment`. Redeploy the frontend on Netlify
to publish the new booking step. No new Netlify secrets or npm dependencies are
required. To restore PayFast after verification, update `PAYFAST_AVAILABLE` and
the availability copy in the frontend, set `PAYFAST_CHECKOUT_ENABLED=true` in
Supabase, and redeploy. Preserve the existing payment verification and email flow.

## PayFast flow

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
RPC, availability rules and six booking steps. The format is
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
