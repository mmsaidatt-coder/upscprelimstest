import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import Script from "next/script";
import { Shell } from "@/components/site/shell";
import {
  WebSiteJsonLd,
  EducationalOrganizationJsonLd,
} from "@/components/seo/json-ld";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const GOOGLE_TAG_ID = "G-QBDYLT8GD9";
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.BING_SITE_VERIFICATION;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1B211C",
};

export const metadata: Metadata = {
  title: {
    default:
      "UPSC Prelims Practice — Free PYQ Tests & Mock Exams | upscprelimstest.com",
    template: "%s",
  },
  description:
    "Free UPSC Prelims practice with 1,199 solved PYQs from 2014–2025, official 2026 paper links, and 10,000+ total practice questions. Timed tests, negative marking, analytics, and subject drills.",
  metadataBase: new URL("https://upscprelimstest.com"),
  applicationName: "UPSC Prelims Test",
  category: "education",
  openGraph: {
    title:
      "UPSC Prelims Practice — Free PYQ Tests & Mock Exams | upscprelimstest.com",
    description:
      "Free UPSC Prelims practice with 1,199 solved PYQs, official 2026 paper links, 10,000+ total practice questions, and analytics-led preparation.",
    url: "https://upscprelimstest.com",
    siteName: "UPSC Prelims Test",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "UPSC Prelims Test — Free Practice Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "UPSC Prelims Practice — Free PYQ Tests & Mock Exams",
    description:
      "1,199 solved UPSC Prelims PYQs from 2014–2025 plus official 2026 paper links and 10,000+ total practice questions. Free timed tests and analytics.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(bingVerification
      ? { other: { "msvalidate.01": bingVerification } }
      : {}),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_TAG_ID}');
        `}
      </Script>
      <body
        className={`${manrope.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <WebSiteJsonLd />
        <EducationalOrganizationJsonLd />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
