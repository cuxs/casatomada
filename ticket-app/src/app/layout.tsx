import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="es">
      <body className="bg-white text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
