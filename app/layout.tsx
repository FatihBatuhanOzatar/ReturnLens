import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editöryel display fontu — başlıklar, italik vurgular için
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "ReturnLens — İade Riski Analiz Aracı",
  description: "Satın almadan önce ürünün iade riskini öğren. Yapay zeka ile ürün yorumlarını analiz eder.",
  openGraph: {
    title: "ReturnLens — İade Riski Analiz Aracı",
    description: "Satın almadan önce ürünün iade riskini öğren. Yapay zeka ile ürün yorumlarını analiz eder.",
    siteName: "ReturnLens",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReturnLens",
    description: "Satın almadan önce ürünün iade riskini öğren.",
  },
  icons: {
    icon: "/icon.svg",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  );
}
