-- Allow privileged/admin service deletion from Supabase. Deleting a service
-- permanently deletes its bookings; existing foreign keys then delete the
-- associated payments, email outbox rows and EFT request records. This does
-- not issue a refund or delete client records. Existing RLS/grants still apply.
-- Applying this migration itself does not delete any records.
begin;

alter table public.bookings
  drop constraint bookings_service_id_fkey;

alter table public.bookings
  add constraint bookings_service_id_fkey
  foreign key (service_id) references public.services(id) on delete cascade;

commit;
