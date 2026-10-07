<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# KMGMT — Project Rules

## Stack decisions
- Full-stack TanStack Start (React 19, SSR) + Tailwind v4 + shadcn/ui. Backend is Lovable Cloud (Supabase Postgres, Auth, Storage). Booking holds use `createServerFn`; PayFast checkout and notifications run in Supabase Edge Functions (`create-payfast-payment`, `payfast-notify`). The website needs public Supabase credentials only; payment secrets and privileged database access stay in Edge Functions.
- Admin gate: `beforeLoad` on the `/admin` layout route checks `supabase.auth.getUser()` and `is_admin()`; each admin route uses `ssr: false`.
- Booking engine lives in SQL: `get_available_slots`, `get_available_dates`, `create_booking_hold`, `expire_stale_holds`, `get_booking_public` RPCs. Anonymous visitors may execute the booking + availability RPCs only. Double-booking is enforced by a GiST exclusion constraint plus buffer via `blocked_until`.
- Never call the admin client for ordinary reads; load `supabaseAdmin` inside server handlers only (`await import('@/integrations/supabase/client.server')`).
- PayFast: prices never come from the frontend — `createPayfastPayment` re-derives the amount from the services table; `payfast-notify` confirms bookings only after signature + PayFast `/eng/query/validate` + amount checks. Payment status is separate from booking status.
- Admin-role rule: a user's id must exist in the `admins` table (`is_admin()` security-definer); never trust client-side role state. Admins log in at `/admin/login` and are created in Supabase Auth + inserted into `admins`.
- Public marketing content (bio, qualifications, contact placeholders) is edited directly in `src/content/site.ts` — no CMS.

## Brand
- Charcoal black / warm white / subtle gold. Gold only for hover/active states, thin rules, icons, small emphasis. Wordmark is typographic (`.wordmark`). Avoid flashy sports graphics, heavy animation, and generic gold-luxury styling.
