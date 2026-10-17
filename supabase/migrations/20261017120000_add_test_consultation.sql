-- Temporary live-payment test offering. Disable it in Admin > Services after testing.
-- Normal booking holds, server-side pricing and verified PayFast notifications apply.
insert into public.services (
  name, slug, short_description, full_description,
  duration_minutes, price_cents, active, display_order
) values (
  'Test Consultation',
  'test-consultation',
  'R5 test booking to check payment and confirmation emails.',
  'Temporary consultation for testing the booking, live PayFast payment and confirmation emails. A real R5 payment is charged. This is a test booking, not a standard consultation.',
  15,
  500,
  true,
  99
)
on conflict (slug) do nothing;
