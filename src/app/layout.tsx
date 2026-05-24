import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import { Toaster } from 'sonner';
import "./globals.css";

const inter = Inter({
  variable: "--pg-font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--pg-font-display",
  subsets: ["latin"],
  weight: "variable",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--pg-font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Propos — Buyer's agent terminal",
  description: "The unified platform for Australian buyer's agents — briefs, matching, shortlists, and client feedback in one workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full" style={{ fontFamily: 'var(--pg-font-body)', background: 'var(--pg-bg)', color: 'var(--pg-text)' }}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
