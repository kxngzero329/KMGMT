# Deploy KMGMT to Netlify

The site uses TanStack Start with server-side rendering and booking server
functions. Nitro's `netlify` preset builds static assets into `dist` and the Node
server function into `.netlify/functions-internal`. `netlify.toml` selects the
build command, publish directory, and Node 22 automatically.

## Connect the repository

1. Push these files and `public/og-image.png` to your repository.
2. In Netlify, select **Add new project → Import an existing project** and choose
   the repository and branch.
3. Leave the base directory empty. The build command is `npm run build` and the
   publish directory is `dist`.
4. Before deploying, add the environment variables below under **Project
   configuration → Environment variables**.
5. Deploy, then add the deployed domain to the payment backend as described below.

Use Git-based deployment or Netlify CLI with a build. Dragging only `dist` into
Netlify does not deploy the server function required for booking requests. Do not
add a `/* /index.html 200` rewrite or set the publish directory to `dist/client`.

`public/_redirects` is available for specific redirect rules and is copied into
`dist` during the build. The routing fallback is already supplied by the generated
Netlify function's `path: "/*"` and `preferStatic: true` settings: existing static
assets are served first, then unmatched URLs go to the SSR handler. Keep that
catch-all in the generated function so page refreshes and booking server functions
use the same router.

## Netlify environment variables

Copy these public values from your local `.env` into Netlify. Make them available
to **Builds and Functions**, in every deploy context you intend to use:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | `https://thtjdoaiukjyxdculnpb.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | The project's public key from `.env` |
| `VITE_SUPABASE_URL` | Same value as `SUPABASE_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same value as `SUPABASE_PUBLISHABLE_KEY` |

These are public project settings, not privileged credentials. The booking server
needs the non-`VITE_` variables at runtime. Keep `.env` out of Git. Values declared
under `[build.environment]` in `netlify.toml` do not become function runtime
variables, so add the Supabase settings through Netlify's environment variable UI.

`VITE_SITE_URL` is optional. The build uses Netlify's primary URL in production
and the deploy/branch preview URL for previews to generate the absolute Open Graph
image URL. Set `VITE_SITE_URL=https://your-domain.example` to explicitly override
that choice, then rebuild. `public/og-image.png` is served at `/og-image.png`.

Keep PayFast credentials, the passphrase, and Supabase service-role/secret keys in
the existing Supabase/Lovable Cloud Edge Function secrets. The website does not
need them in Netlify.

## Allow payments from the new domain

In the existing **Supabase/Lovable Cloud Edge Function secrets**, append the
Netlify domain (including `https://`, without a trailing slash) to
`PAYFAST_ALLOWED_ORIGINS`, keeping any other domains already in that comma-separated
list. For example:

```env
PAYFAST_ALLOWED_ORIGINS=https://kmgmt-preview.vercel.app,https://your-site.netlify.app,https://your-custom-domain.example
```

Use the actual deployed domains, not the example names. If `SITE_URL` still points
at the old Vercel host, update it to the new primary domain. This setting is in the
payment backend, separate from Netlify's `VITE_SITE_URL`. Individual deploy preview
domains also require explicit approval in the allowlist if you test payments there.

The payment and notification functions remain hosted on Supabase. No PayFast
webhook URL change is needed when moving the website to Netlify.

## Check the deployed site

- Open `/`, `/book`, `/services`, and `/admin/login` directly and refresh them.
- Open `/og-image.png` and check that page source has an absolute `og:image` URL
  on your Netlify/custom domain.
- Create a sandbox booking and complete payment. Confirm that the payment request
  passes CORS, PayFast returns to the new domain, and the booking becomes confirmed
  after the verified payment notification.

Local verification: `npm ci`, `npm run build`, and `npm test`. For a full Netlify
preview, run `npx netlify-cli dev` after setting up the Netlify project and its
environment variables.
