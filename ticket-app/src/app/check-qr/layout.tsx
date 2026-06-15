import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Validar entrada — Casa Tomada",
  robots: { index: false, follow: false },
};

export default function CheckQRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
