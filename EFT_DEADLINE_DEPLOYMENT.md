# EFT payment deadline rollout

Deployed to Supabase on 7 November 2026 after project access was restored.
`process-eft-emails` was deployed first, followed by migration
`20261107120000_eft_payment_deadlines.sql`. Database types were regenerated from
the linked project. Read-only configuration inspection confirmed the deadline
and snapshot triggers and the active minute schedule; the expiry RPC is not
callable by anonymous or authenticated browser users.

**The backend deadline and cancellation schedule are live.** Push/redeploy the
frontend on Netlify to publish the booking, policy, FAQ and admin changes. No
tests, simulated bookings/payments, manual expiry runs or sample emails were run.

For future deployments, use an account with permission to deploy Edge Functions
and apply migrations to this project. Never put a personal access token in a
public environment variable or commit it to the repository.

Deploy in this order, before publishing the frontend:

```powershell
supabase login
supabase functions deploy process-eft-emails --project-ref thtjdoaiukjyxdculnpb --use-api
supabase db push --linked --yes
```

The worker must be deployed first so it understands the cancellation email job
types before the migration schedules them. It remains compatible with legacy
snapshots while the migration is pending. Regenerate the Supabase database types
after the migration; the local types already describe the proposed new fields.
Then push/redeploy the frontend on Netlify. The admin queries use the new fields,
so do not deploy the frontend ahead of the database migration.

## Behavior

- New EFT payments receive a server-controlled deadline: 72 hours after the
  booking's creation time, or its consultation start if sooner. Calendar days
  include weekends and public holidays. A delayed invoice or retried request does
  not extend the window.
- Existing EFT bookings retain a null deadline and their previous terms. There
  is deliberately no backfill or retroactive cancellation.
- A private SQL cron task runs each minute and cancels overdue, unverified EFT
  reservations. It cancels the pending payment, stores the reason, releases the
  slot and queues customer/admin cancellation emails. It does not delete records
  or issue refunds. Cancellation happens on the next scheduled run after expiry.
- Kieraan must verify the funds and select **Mark EFT received** before the
  deadline. Proof sent through WhatsApp or email alone does not stop expiry.
  Verification after expiry is rejected; admins must reconcile late/unrecorded
  funds and arrange another booking or discuss a manual refund. Cancelled slots
  are not automatically reinstated.
- The public booking page polls pending EFT status. Admin bookings, payments,
  dashboard and calendar refresh while open, and booking dialogs load the current
  record. Exact deadlines are displayed in SAST. Paid and legacy reservations are
  excluded from automatic cancellation.
- New customer/admin EFT emails and the PDF invoice contain the deadline and
  policy. Cancellation emails contain no payment buttons or bank details. The
  existing PayFast confirmation templates, checkout and ITN verification are
  unchanged. Existing frozen email payloads remain unchanged for idempotency.

No new secrets, frontend bank details, npm dependencies or video-call changes
are required. The owner will perform their own testing after deployment.
