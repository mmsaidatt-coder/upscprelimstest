/**
 * JSON-LD structured data components for SEO.
 *
 * These inject <script type="application/ld+json"> into the page,
 * enabling rich results in Google Search (sitelinks, FAQs, breadcrumbs).
 */

type JsonLdProps = {
  data: Record<string, unknown>;
};

/** Generic JSON-LD script injector */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** WebSite schema — enables Google sitelinks search box */
export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "UPSC Prelims Test",
        alternateName: "upscprelimstest",
        url: "https://upscprelimstest.com",
        description:
          "Free UPSC Prelims practice platform with 1,200+ previous year questions, exam-grade simulations, and analytics-led preparation.",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate:
              "https://upscprelimstest.com/pyq?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

/** Organization schema — brand identity for Google Knowledge Panel */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "UPSC Prelims Test",
        url: "https://upscprelimstest.com",
        logo: "https://upscprelimstest.com/logo.png",
        description:
          "Premium UPSC Prelims practice platform with exam-grade simulations, review flows, and analytics-led preparation.",
        sameAs: [],
      }}
    />
  );
}

/** FAQPage schema — enables FAQ rich results in Google */
export function FaqJsonLd({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }}
    />
  );
}

/** EducationalOrganization schema — specific to ed-tech platforms */
export function EducationalOrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        name: "UPSC Prelims Test",
        url: "https://upscprelimstest.com",
        description:
          "Free online platform for UPSC Civil Services Preliminary Examination practice with previous year questions from 2014 to 2025.",
        areaServed: {
          "@type": "Country",
          name: "India",
        },
      }}
    />
  );
}
