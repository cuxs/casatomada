import type { Metadata } from "next";
import { Epilogue, Space_Mono } from "next/font/google";
import "./globals.css";

const epilogue = Epilogue({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-epilogue",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-space-mono",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Casa Tomada — Entradas",
  description: "Conseguí tu entrada para el evento",
  openGraph: {
    title: "Casa Tomada",
    description: "Conseguí tu entrada para el evento",
    images: [
      {
        url: "/comprar-entradas/02E.jpg",
        width: 1080,
        height: 1350,
        alt: "Casa Tomada — Entradas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Casa Tomada",
    description: "Conseguí tu entrada para el evento",
    images: ["/comprar-entradas/02E.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${epilogue.variable} ${spaceMono.variable}`}>
      <body className="bg-black text-white min-h-screen" style={{ fontFamily: "var(--font-epilogue), sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
