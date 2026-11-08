# Public reviews

Visitors can leave a display name, 1–5 star rating, optional role and review from the homepage's testimonials section. A private email address is required for reply notifications. Publishing requires explicit consent and confirmation that the submitter is 18 or older. No booking, account or phone is requested. Reviews publish immediately; they are not verified against bookings and have no approval queue.

The homepage shows the six newest visitor reviews alongside the existing curated testimonials. Long visitor reviews use compact previews on the homepage. Cards with a KMGMT response show **View reply**, which opens the full response in a dialog and pauses the carousel while it is open. **View all reviews** opens a paginated list with the full review and reply text. Public queries refresh on focus/reconnect and every minute while the section is mounted. A successful submission immediately refreshes the public review cache. Reviews and replies are also included in the homepage's server-rendered public data, with a fallback if Supabase is unavailable.

## Admin replies

Open **Admin → Testimonials → Visitor reviews**. Use **Reply as KMGMT** or **Edit your reply**. One public response per review can be published, updated or removed. Publishing or changing a reply queues a reviewer email. Saving unchanged text or deleting a reply does not send a new email. Older reviews have no collected email and are labelled accordingly; addresses are never guessed from booking/client records. The original visitor review and rating cannot be edited, hidden or deleted through the dashboard. Existing curated testimonials retain their separate controls.

`reviews` has public SELECT access only. There is no anonymous INSERT or admin UPDATE/DELETE grant. The separate `review_replies` table checks `is_admin()` for every write through RLS. Replies are displayed as plain text with the label **Response from KMGMT**. The privileged submission RPC is executable only by `service_role`.

## Edge Function and deployment

Migrations: `supabase/migrations/20261108120000_public_reviews.sql` and `supabase/migrations/20261108140000_review_email_notifications.sql`.

Functions: `submit-review` (JWT gateway check disabled; handler checks the project public key, allowed origin, consent and full payload) and `process-review-emails` (private worker authenticated by `EMAIL_WORKER_TOKEN`). Payment, booking and contact delivery functions/templates are unchanged.

The function requires `REVIEW_HASH_SECRET` in **Supabase secrets**, a dedicated random secret used to HMAC network hints and submission fingerprints. It is never a frontend environment variable. Supabase injects the database credentials. Production `https://kmgmt.co.za`, `https://www.kmgmt.co.za` and localhost development origins are supported; exact extra origins can be supplied in `REVIEW_ALLOWED_ORIGINS` as a comma-separated list. Existing `SITE_URL` and `PAYFAST_ALLOWED_ORIGINS` are also honoured. Wildcard preview hosts are not authorised automatically.

Submission protection includes bounded request bodies, length/rating/email validation, a hidden spam field, atomic limits of three accepted submissions per network hint and per email in a 24-hour window and 60 globally per hourly window, a 24-hour duplicate-content fingerprint, and idempotent UUID retries. Network headers are an abuse signal, not an identity or proof of a genuine client; these controls cannot eliminate all spam on an open public form. Raw IPs are not stored in review tables. The private counters and receipts expire and are cleaned hourly by `cleanup-review-submissions`. Email validation checks format, not mailbox ownership.

## Email notifications

New-review notifications go to the existing `ADMIN_NOTIFICATION_EMAIL` Supabase secret. The notification includes the review, rating, display name, optional role, private email and an **Open dashboard** link. Admin email replies contact the reviewer privately; public replies must still be posted through the dashboard.

Reviewer notifications include the original review, KMGMT’s response and a link that opens that exact review on the homepage, including reviews outside the newest six. The URL contains only the public review UUID; never an email address or private token. A missing/removed review has a safe fallback message.

`review_contacts` stores recipient email addresses separately, with no public access. Dashboard admins may SELECT only its `review_id` column to show whether notification is available; the email column and all writes remain service-only. The existing public review queries/cards contain no email field.

`review_email_outbox` is private and queues notifications in the same database transaction as the submission/reply. `process-review-emails` uses the existing verified `EMAIL_FROM`, `EMAIL_SITE_URL`, `ADMIN_NOTIFICATION_EMAIL`, `RESEND_API_KEY` and `EMAIL_WORKER_TOKEN` Supabase secrets. The every-minute `kmgmt-review-email-retries` cron dispatches only this worker, using Vault's existing `booking_email_worker_token`. There are no browser calls to Resend.

Queue jobs have leases, automatic backoff and frozen request payloads with stable Resend idempotency keys. Ambiguous retries stop after 23 hours and become `manual_review`, preventing blind resends after the provider’s 24-hour idempotency window. Pending reply notifications are cancelled if superseded or removed before sending; email already sent cannot be recalled. Check `review_email_outbox` in Supabase for delivery status, attempts and safe error codes. Old reviews/replies are not backfilled or emailed on deployment.

## Privacy requests

The public form links to the updated Privacy Policy. A review correction/removal request is handled by KMGMT through the existing privacy contact process. Following appropriate verification, an authorised database operator can correct or remove the specific row in Supabase. Deleting a review cascades to its reply, private contact, email jobs and retry receipt. Dashboard admins only manage their replies; there is no public deletion endpoint. Stop notifications for an appropriate request by removing its private contact and cancelling/deleting outstanding email jobs as well.

Booking/payment flows and their notification templates are unchanged. No sample reviews, live flow submissions, sample emails or automated tests are needed for deployment.
