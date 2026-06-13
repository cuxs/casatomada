import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrar compra — Casa Tomada",
  robots: { index: false, follow: false },
};

export default function RegisterSaleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
