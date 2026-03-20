import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Manrope, Teko } from "next/font/google";
import { Shell } from "@/components/site/shell";
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

export const metadata: Metadata = {
  title: "UPSCPRELIMSTEST",
  description:
    "Premium UPSC prelims practice platform with exam-grade simulations, review flows, and analytics-led preparation.",
  metadataBase: new URL("https://upscprelimstest.com"),
  openGraph: {
    title: "UPSCPRELIMSTEST",
    description:
      "Premium UPSC prelims practice platform with exam-grade simulations, review flows, and analytics-led preparation.",
    url: "https://upscprelimstest.com",
    siteName: "UPSCPRELIMSTEST",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UPSCPRELIMSTEST",
    description:
      "Premium UPSC prelims practice platform with exam-grade simulations, review flows, and analytics-led preparation.",
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
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
