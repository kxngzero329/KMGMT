# Deleting records in the admin dashboard

Each Delete button shows the affected record and related data, and requires
typing `DELETE`. Permanent deletion is separate from cancelling a booking,
deactivating a service or archiving a player. Those options retain history.

| Admin screen                                                      | What permanent deletion removes                                                                                                                                                               |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bookings, booking details, calendar and dashboard booking dialogs | The booking, its payments, booking/EFT email queue rows (including stored invoice payloads), and EFT request records. The client profile and service are kept.                                |
| Clients                                                           | The client profile and all its bookings, with the same payment/email/EFT cleanup.                                                                                                             |
| Services                                                          | The service and all its bookings, with the same payment/email/EFT cleanup. Client profiles are kept.                                                                                          |
| Payments                                                          | **Delete booking & payments** removes the associated booking and all its payment/email/EFT records together. There is no action to leave a confirmed booking with its payment record removed. |
| Players                                                           | The player profile. Archive remains available. Photo files in Storage are retained because they can be shared; delete unused files separately in Supabase Storage.                            |
| Testimonials                                                      | The testimonial.                                                                                                                                                                              |
| Enquiries                                                         | The enquiry and its contact email queue record.                                                                                                                                               |
| Availability                                                      | The selected weekly working-hours block or date rule, including past date rules. Existing bookings are kept.                                                                                  |

Deleting records does not refund a payment or recall emails/invoice attachments
already sent. Handle required refunds before deleting the transaction history.
The freed time remains subject to booking notice, buffer and availability rules.
Client deletion applies to the selected client record; another record with the
same email is not automatically deleted.

Authentication accounts, admin membership and the singleton booking settings
record are outside this dashboard deletion feature. Settings can still be edited.

## Database enforcement

`admin_delete_record(text, uuid)` checks `auth.uid()` and `is_admin()` and permits
only the eight explicit record types. It uses static SQL and `SECURITY INVOKER`,
so existing table grants and admin RLS still apply. Anonymous users cannot call
the function; a signed-in user without an `admins` row cannot delete records.
No service-role key is needed in the frontend.

Foreign-key cascades perform the related deletions in the same transaction.
Service and client deletion cascade into bookings; booking deletion cascades
into payments, both booking email queues and EFT requests. Enquiry deletion
cascades into the contact email queue. Unrelated clients, services and records
remain. Essential settings and authentication tables are not in the allowlist.

After deletion the UI cancels outstanding reads and refreshes admin, public and
booking status queries, including dashboard totals and calendar availability.
A network error may leave the client unsure whether deletion committed; refresh
before retrying. Deleted records are reported separately from permission errors.

Migrations configure the behavior without deleting existing rows. Regenerate
Supabase database types after applying them. Deploy the frontend through Netlify
to publish the dashboard controls. There are no new secrets or Edge Functions.
