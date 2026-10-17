import { consultant, contactDetails } from "@/content/site";

// Canonicals always identify the public site, including builds on preview hosts.
export const SITE_URL = "https://kmgmt.co.za";
export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`;
export const SEO_PREVIEW = import.meta.env["VITE_SEO_NOINDEX"] === "true";

const pages = {
  "/": {
    title: "Football Career Consultant in South Africa | KMGMT",
    description:
      "Online football career guidance with Kieraan. Book consultations for player assessments, career decisions and international football pathways.",
    name: "Football career guidance",
  },
  "/services": {
    title: "Football Career Consultations & Player Assessments | KMGMT",
    description:
      "Explore KMGMT online football consultations: career planning, player assessments, career decisions and international pathways. View prices and book with Kieraan.",
    name: "Consultation services",
  },
  "/international-pathways": {
    title: "International Football Career Guidance | KMGMT",
    description:
      "Plan your next football step beyond South Africa. Get independent advice on international markets, player readiness, football CVs and highlight footage.",
    name: "International football pathways",
  },
  "/players": {
    title: "Football Player Profiles & Career Journeys | KMGMT",
    description:
      "Meet the football players KMGMT works with. Explore player profiles, playing backgrounds and the individual journeys behind their next career step.",
    name: "Our players",
  },
  "/about": {
    title: "About Kieraan, Football Career Consultant | KMGMT",
    description:
      "Meet Kieraan, the independent football career consultant behind KMGMT. Honest, personal guidance for South African football players and their parents.",
    name: "About Kieraan",
  },
  "/contact": {
    title: "Contact KMGMT | Football Career Enquiries & WhatsApp",
    description:
      "Contact KMGMT about football career guidance, consultation bookings or player advice. Send an enquiry or connect with Kieraan's team on WhatsApp.",
    name: "Contact KMGMT",
  },
  "/book": {
    title: "Book an Online Football Career Consultation | KMGMT",
    description:
      "Book an online football career consultation with Kieraan. Choose your session, share your details, select an available time and pay securely through PayFast.",
    name: "Book a consultation",
  },
  "/privacy": {
    title: "Privacy Policy & Personal Information | KMGMT",
    description:
      "Read how KMGMT handles personal information, football CVs, player footage, booking details and payment records, including your rights under POPIA.",
    name: "Privacy Policy",
  },
  "/terms": {
    title: "Terms, Refunds & Consultation Booking Policies | KMGMT",
    description:
      "Read KMGMT's consultation terms, service delivery policy, 24-hour cancellation and rescheduling policy, and manual refund process.",
    name: "Terms and booking policies",
  },
} as const;

export type SeoPath = keyof typeof pages;

interface SeoService {
  name: string;
  slug: string;
  short_description: string;
  price_cents: number;
}

function structuredData(path: SeoPath, services: readonly SeoService[]) {
  const page = pages[path];
  const canonical = new URL(path, SITE_URL).href;
  const organizationId = `${SITE_URL}/#organization`;
  const websiteId = `${SITE_URL}/#website`;
  const socialProfiles = [
    contactDetails.instagram,
    contactDetails.facebook,
    contactDetails.linkedin,
    contactDetails.tiktok,
  ].filter((value) => /^https:\/\//i.test(value));
  const organization = {
    "@type": "Organization",
    "@id": organizationId,
    name: "KMGMT",
    url: `${SITE_URL}/`,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.png`, width: 512, height: 512 },
    description: "Independent football career guidance for players and parents in South Africa.",
    ...(contactDetails.whatsapp
      ? { telephone: `+${contactDetails.whatsapp.replace(/\D/g, "")}` }
      : {}),
    ...(contactDetails.email ? { email: contactDetails.email } : {}),
    ...(socialProfiles.length ? { sameAs: socialProfiles } : {}),
    areaServed: { "@type": "Country", name: "South Africa" },
  };
  const webPage = {
    "@type":
      path === "/about"
        ? "AboutPage"
        : path === "/contact"
          ? "ContactPage"
          : path === "/players" || path === "/services"
            ? "CollectionPage"
            : "WebPage",
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: page.title,
    description: page.description,
    inLanguage: "en-ZA",
    isPartOf: { "@id": websiteId },
    publisher: { "@id": organizationId },
    primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE_URL, width: 1731, height: 909 },
    ...(path !== "/" ? { breadcrumb: { "@id": `${canonical}#breadcrumb` } } : {}),
    ...(path === "/about" ? { mainEntity: { "@id": `${SITE_URL}/about#kieraan` } } : {}),
    ...(path === "/services" && services.length
      ? {
          mainEntity: {
            "@type": "OfferCatalog",
            name: "KMGMT football consultations",
            itemListElement: services
              .filter((service) => service.slug !== "test-consultation")
              .map((service) => ({
                "@type": "Offer",
                priceCurrency: "ZAR",
                price: (service.price_cents / 100).toFixed(2),
                url: `${SITE_URL}/book?service=${encodeURIComponent(service.slug)}`,
                itemOffered: {
                  "@type": "Service",
                  "@id": `${SITE_URL}/services#${encodeURIComponent(service.slug)}`,
                  name: service.name,
                  description: service.short_description,
                  serviceType: "Online football career consultation",
                  provider: { "@id": organizationId },
                },
              })),
          },
        }
      : {}),
  };
  const graph: Record<string, unknown>[] = [
    organization,
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: "KMGMT",
      url: `${SITE_URL}/`,
      inLanguage: "en-ZA",
      publisher: { "@id": organizationId },
    },
    webPage,
  ];
  if (path !== "/")
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: page.name, item: canonical },
      ],
    });
  if (path === "/about")
    graph.push({
      "@type": "Person",
      "@id": `${SITE_URL}/about#kieraan`,
      name: consultant.name,
      jobTitle: consultant.title,
      description: consultant.bio,
      url: `${SITE_URL}/about`,
      worksFor: { "@id": organizationId },
    });
  return { "@context": "https://schema.org", "@graph": graph };
}

export function pageSeo(path: SeoPath, services: readonly SeoService[] = []) {
  const page = pages[path];
  const canonical = new URL(path, SITE_URL).href;
  return {
    meta: [
      { title: page.title },
      { name: "description", content: page.description },
      {
        name: "robots",
        content: SEO_PREVIEW ? "noindex, nofollow" : "index, follow, max-image-preview:large",
      },
      { property: "og:title", content: page.title },
      { property: "og:description", content: page.description },
      { property: "og:url", content: canonical },
      { name: "twitter:title", content: page.title },
      { name: "twitter:description", content: page.description },
    ],
    links: [{ rel: "canonical", href: canonical }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(structuredData(path, services))
          .replace(/</g, "\\u003c")
          .replace(/\u2028/g, "\\u2028")
          .replace(/\u2029/g, "\\u2029"),
      },
    ],
  };
}
