# KMGMT: Google Search Console launch guide

The canonical website is **https://kmgmt.co.za/**. Complete these steps after
publishing the SEO changes to Netlify's **production** deployment.

## 1. Publish the site and confirm the domain

1. Commit and push these changes to the branch Netlify uses for production.
2. Wait for the production deployment to finish. A deploy preview is intentionally
   marked `noindex`; it is not the version to submit to Google.
3. In Netlify's **Domain management**, set **kmgmt.co.za** as the primary domain.
   Keep `www.kmgmt.co.za` attached as its alternative domain and keep HTTPS active.
   The site's canonical URLs, sitemap and structured data use the non-www domain.
   Netlify redirects the attached alternative www domain to the primary domain.
   [Netlify domain guidance](https://docs.netlify.com/domains/manage-domains/manage-multiple-domains/)
4. Open these URLs in your browser after deployment:
   - https://kmgmt.co.za/
   - https://kmgmt.co.za/services
   - https://kmgmt.co.za/sitemap.xml
   - https://kmgmt.co.za/robots.txt
   - https://kmgmt.co.za/og-image.png
5. The sitemap should display XML with nine public URLs. It should not display a
   404 or the website's normal HTML layout. Keep Nitro's existing SSR routing;
   do not add an SPA rewrite to `index.html`.

If an old Vercel deployment is still publicly available, configure that deployment
to redirect to this production site or retire it when it is no longer needed.
Changes in this repository cannot alter an older deployment on another host.

## 2. Add the Google property

1. Sign in to [Google Search Console](https://search.google.com/search-console/)
   with the Google account that should own the business's property.
2. Choose **Add property** and select **Domain**.
3. Enter exactly **kmgmt.co.za** — without `https://`, `www` or a path.
4. Continue and copy the TXT verification value supplied by Google. It starts
   with `google-site-verification=`. Use Google's actual value; there is no
   universal verification token to put in the source code.

A Domain property covers the domain's www/non-www and HTTP/HTTPS variations.
[Google property instructions](https://support.google.com/webmasters/answer/34592?hl=en)
This guide uses DNS verification, so no Google verification value or analytics
tag needs to be added to the application's `.env` or frontend code.

## 3. Add Google's DNS TXT record

Add the record at the provider that manages **kmgmt.co.za's authoritative DNS**.
Connecting a domain to Netlify does not necessarily mean its DNS is hosted there.
If Netlify manages the nameservers, use its domain DNS records screen; otherwise
use the current registrar or DNS provider.

| Field         | Value                                                                            |
| ------------- | -------------------------------------------------------------------------------- |
| Type          | TXT                                                                              |
| Host/name     | The root domain: usually `@`, blank, or `kmgmt.co.za`, as your provider requires |
| Value/content | The complete `google-site-verification=...` value Google supplied                |
| TTL           | Leave the provider's default                                                     |

Save the new TXT record, return to Search Console and select **Verify**. DNS
changes can take time to propagate. If it fails, wait and retry, then check the
host and copied value if necessary. Leave the verification record in place after
success. Add it alongside existing records; do not replace Netlify routing,
Resend verification, SPF, DKIM or mail records.
[Google ownership verification](https://support.google.com/webmasters/answer/9008080?hl=en)

## 4. Submit the sitemap

1. Select the verified `kmgmt.co.za` property.
2. Open **Sitemaps**.
3. Submit **https://kmgmt.co.za/sitemap.xml**. If Google displays a prefilled URL
   prefix, enter only `sitemap.xml` in the remaining field.
4. Monitor the submission until it reports **Success**. It contains the home,
   services, international pathways, players, about, contact, booking, privacy
   and terms pages.

There are no admin, payment status, private booking-reference or test-service
query URLs in this sitemap. Do not submit Netlify preview URLs.
[Google Sitemaps report](https://support.google.com/webmasters/answer/7451001?hl=en)

## 5. Request indexing for the main pages

Use the top **URL Inspection** field for these production URLs:

- https://kmgmt.co.za/
- https://kmgmt.co.za/services
- https://kmgmt.co.za/international-pathways
- https://kmgmt.co.za/about
- https://kmgmt.co.za/contact

For each, use **Test live URL** after deployment. Confirm the page is reachable
and indexing is allowed, then choose **Request indexing**. The submitted sitemap
also lets Google discover the other public pages. Repeatedly requesting the same
URL does not speed up Google's crawl.
[Google URL Inspection instructions](https://support.google.com/webmasters/answer/9012289?hl=en)

On an indexed page, compare **User-declared canonical** with **Google-selected
canonical**. The declared value should use `https://kmgmt.co.za` and the correct
page path. Booking service-selection and tracking parameters intentionally
canonicalise to the clean page URL.
[Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/canonicalization-troubleshooting)

## 6. Monitor the reports

- **Page indexing:** investigate unexpected blocks, server errors and missing
  public pages. Admin/login and payment-success/cancelled pages are deliberately
  `noindex`; they should not become search results. Netlify preview deployments
  also have noindex metadata, though their separate domains are outside this
  production Domain property's coverage.
- **Performance → Search results:** review impressions, clicks, queries and pages
  as Google starts collecting data. Use actual searches to guide future content.
- **Core Web Vitals:** a new or low-traffic site may not have enough field data
  yet. This report is based on real visitor data.
- **Security issues / Manual actions:** check for notices and address any listed
  issues rather than assuming a ranking problem.

Google controls crawling, indexing and rankings. Discovery may take days or
weeks; sitemap submission and indexing requests do not guarantee inclusion or a
particular position. [Google's recrawling guidance](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)

## Structured data and future updates

The implementation includes Organization, WebSite, page, breadcrumb and Kieraan
Person data. The services page also uses its current public Supabase prices in
an offer catalogue; the temporary R5 test consultation is excluded from this
catalogue. There are no invented reviews, ratings, street addresses or licence
claims. A video-meeting platform or booking guarantee is not implied.

If you review the schema yourself, use [Schema.org Validator](https://validator.schema.org/)
for general schema and [Google Rich Results Test](https://search.google.com/test/rich-results)
for Google's supported rich-result types. Not every valid schema type produces
a Google rich result; WebSite site-name markup is not supported by the Rich
Results Test. [Google's site-name guidance](https://developers.google.com/search/docs/appearance/site-names)

Maintain approved public business details and social profiles in
`src/content/site.ts`. Add real credentials and approved images only when they
are available. The private admin notification email stays in Supabase secrets.
When adding a new public page, update `src/lib/seo.ts` and `public/sitemap.xml`.
The sitemap omits `lastmod` until genuine per-page modification dates are
maintained; do not stamp every URL with each deployment date.

No tests, production build, payment checks, automated form submissions or sample
emails were run for this change, in accordance with the earlier instruction.
The deployment and Search Console steps above remain for the site owner.
