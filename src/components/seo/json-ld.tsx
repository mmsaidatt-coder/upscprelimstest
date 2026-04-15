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
          "Free UPSC Prelims practice platform with 1,200+ previous year questions, 10,000+ total AI-enriched practice questions, exam-grade simulations, and analytics-led preparation.",
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
          "Free online platform for UPSC Civil Services Preliminary Examination practice with previous year questions from 2014 to 2025 and a larger AI-enriched custom practice bank.",
        areaServed: {
          "@type": "Country",
          name: "India",
        },
      }}
    />
  );
}

/** Course schema — structured data for the PYQ practice course */
export function CourseJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Course",
        name: "UPSC Prelims PYQ Practice (2014–2025)",
        description:
          "Practice 1,200+ UPSC Civil Services Preliminary Examination previous year questions spanning 12 years. Covers Polity, History, Economy, Geography, Environment, Science, and Current Affairs with timed exam simulations and analytics.",
        url: "https://upscprelimstest.com/pyq",
        provider: {
          "@type": "Organization",
          name: "UPSC Prelims Test",
          url: "https://upscprelimstest.com",
        },
        educationalLevel: "Graduate",
        about: [
          { "@type": "Thing", name: "UPSC Civil Services Examination" },
          { "@type": "Thing", name: "Indian Administrative Service (IAS)" },
          { "@type": "Thing", name: "General Studies Paper I" },
        ],
        teaches: [
          "Indian Polity and Constitution",
          "Modern Indian History and Freedom Struggle",
          "Indian and World Geography",
          "Indian Economy and Economic Development",
          "Environment and Ecology",
          "General Science and Technology",
          "Current Affairs and Events of National Importance",
        ],
        numberOfCredits: 0,
        isAccessibleForFree: true,
        inLanguage: "en",
        availableLanguage: "en",
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: "Self-paced",
        },
      }}
    />
  );
}

/** Quiz schema — structured data for a year-specific PYQ set */
export function QuizJsonLd({ year, questionCount }: { year: number; questionCount: number }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Quiz",
        name: `UPSC Prelims ${year} — Previous Year Questions`,
        description: `Practice ${questionCount} questions from the UPSC Civil Services Preliminary Examination ${year} General Studies Paper I. Timed session with negative marking.`,
        url: `https://upscprelimstest.com/app/pyq/run?year=${year}&limit=100`,
        educationalLevel: "Graduate",
        about: {
          "@type": "Thing",
          name: `UPSC CSE Prelims ${year}`,
        },
        provider: {
          "@type": "Organization",
          name: "UPSC Prelims Test",
          url: "https://upscprelimstest.com",
        },
        isAccessibleForFree: true,
        inLanguage: "en",
        assesses: [
          "Indian Polity",
          "History",
          "Geography",
          "Economy",
          "Environment",
          "Science & Technology",
          "Current Affairs",
        ],
        educationalAlignment: {
          "@type": "AlignmentObject",
          alignmentType: "assesses",
          educationalFramework: "UPSC CSE Syllabus",
          targetName: "General Studies Paper I",
        },
      }}
    />
  );
}

/** LearningResource schema — for individual subject drill pages */
export function LearningResourceJsonLd({ subject, questionCount }: { subject: string; questionCount: number }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: `UPSC Prelims ${subject} — Previous Year Questions`,
        description: `Practice ${questionCount} ${subject} questions from UPSC Prelims (2014–2025). AI-enriched metadata with topic classifications, keywords, and difficulty analysis.`,
        url: `https://upscprelimstest.com/app/pyq/run?subject=${encodeURIComponent(subject)}&limit=50`,
        learningResourceType: "Practice test",
        educationalLevel: "Graduate",
        teaches: subject,
        isAccessibleForFree: true,
        inLanguage: "en",
        provider: {
          "@type": "Organization",
          name: "UPSC Prelims Test",
          url: "https://upscprelimstest.com",
        },
      }}
    />
  );
}
