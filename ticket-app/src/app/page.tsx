import type { Metadata } from "next";
import { getEventConfig } from "@/config";
import HomePageClient from "./home-page-client";

const PRICE_CHANGES = [
  { at: new Date("2026-06-24T03:00:00Z"), label: "Pajarito tempranero", price: 10000 },
  { at: new Date("2026-07-01T03:00:00Z"), label: "Primera tanda", price: 13000 },
];

function getCurrentTierDescription(): string {
  const now = new Date();
  for (const change of PRICE_CHANGES) {
    if (now < change.at) {
      return `${change.label} $${change.price.toLocaleString("es-AR")} — Conseguí tu entrada`;
    }
  }
  return "Segunda tanda $15.000 — Conseguí tu entrada";
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
