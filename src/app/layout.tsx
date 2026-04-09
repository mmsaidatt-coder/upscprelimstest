import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Manrope, Teko } from "next/font/google";
import { Shell } from "@/components/site/shell";
import {
  WebSiteJsonLd,
  OrganizationJsonLd,
  EducationalOrganizationJsonLd,
} from "@/components/seo/json-ld";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FAF7F2",
};

export const metadata: Metadata = {
  title: {
    default:
      "UPSC Prelims Practice — Free PYQ Tests & Mock Exams | upscprelimstest.com",
    template: "%s | upscprelimstest.com",
  },
  description:
    "Free UPSC Prelims practice platform with 1,200+ previous year questions from 2014–2025. Exam-grade simulations, timed tests, negative marking, detailed analytics, and subject-wise drills.",
  metadataBase: new URL("https://upscprelimstest.com"),
  alternates: {
    canonical: "/",
  },
  keywords: [
    "UPSC Prelims",
    "UPSC PYQ",
    "UPSC previous year questions",
    "UPSC mock test",
    "UPSC practice",
    "IAS prelims",
    "civil services exam",
    "UPSC test series",
    "free UPSC test",
    "UPSC 2025",
    "UPSC 2026",
  ],
  openGraph: {
    title:
      "UPSC Prelims Practice — Free PYQ Tests & Mock Exams | upscprelimstest.com",
    description:
      "Free UPSC Prelims practice with 1,200+ PYQs, exam-grade simulations, and analytics-led preparation.",
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
      "1,200+ UPSC Prelims PYQs from 2014–2025. Timed tests, negative marking, analytics. 100% free.",
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
    // Add your Google Search Console verification code here after setup
    // google: "your-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${teko.variable} antialiased`}
      >
        <WebSiteJsonLd />
        <OrganizationJsonLd />
        <EducationalOrganizationJsonLd />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
