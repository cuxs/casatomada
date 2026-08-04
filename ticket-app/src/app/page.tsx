import type { Metadata } from "next";
import { getEventConfig } from "@/config";
import HomePageClient from "./home-page-client";

const SALE_CUTOFF = new Date("2026-08-23T00:00:00Z"); // 21:00 Buenos Aires, Aug 22

function getCurrentTierDescription(): string {
  const now = new Date();
  if (now < SALE_CUTOFF) {
    return "Entradas $8.000 — Conseguí tu entrada";
  }
  return "Casa Tomada";
}

export async function generateMetadata(): Promise<Metadata> {
  const description = getCurrentTierDescription();
  return {
    title: "Casa Tomada — Entradas",
    description,
    openGraph: {
      title: "Casa Tomada",
      description,
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
      description,
      images: ["/comprar-entradas/02E.jpg"],
    },
  };
}

export default function HomePage() {
  return <HomePageClient eventConfig={getEventConfig()} />;
}
