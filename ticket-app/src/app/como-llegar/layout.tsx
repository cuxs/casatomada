import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cómo llegar — Casa Tomada",
  description: "Información para llegar al evento",
};

export default function ComoLlegarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
