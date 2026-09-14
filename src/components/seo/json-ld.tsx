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
        "@id": "https://upscprelimstest.com/#website",
        name: "UPSC Prelims Test",
        alternateName: "upscprelimstest",
        url: "https://upscprelimstest.com",
        description:
          "Free UPSC Prelims practice platform with 1,199 solved previous-year questions, official 2026 paper links, 10,000+ total practice questions, exam simulations, and analytics.",
        inLanguage: "en-IN",
        publisher: { "@id": "https://upscprelimstest.com/#organization" },
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
        "@id": "https://upscprelimstest.com/#organization",
        name: "UPSC Prelims Test",
        url: "https://upscprelimstest.com",
        logo: {
          "@type": "ImageObject",
          url: "https://upscprelimstest.com/logo.png",
        },
        description:
          "Independent free platform for UPSC Civil Services Preliminary Examination practice with 1,199 solved questions from 2014 to 2025, official 2026 paper links, and a larger AI-enriched custom practice bank.",
        areaServed: {
          "@type": "Country",
          name: "India",
        },
        knowsAbout: [
          "UPSC Civil Services Preliminary Examination",
          "General Studies Paper I",
          "Previous year question practice",
        ],
      }}
    />
  );
}
