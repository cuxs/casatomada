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

export const metadata: Metadata = {
  title: "Casa Tomada — Entradas",
  description: "Conseguí tu entrada para el evento",
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
