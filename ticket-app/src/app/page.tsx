import type { Metadata } from "next";
import { getEventConfig } from "@/config";
import { getPriceInfo, SALE_CUTOFF } from "@/lib/pricing";
import HomePageClient from "./home-page-client";

function getCurrentTierDescription(): string {
  const now = new Date();
  if (now < SALE_CUTOFF) {
    const { currentLabel, currentPrice } = getPriceInfo(now);
    const label = currentLabel.charAt(0).toUpperCase() + currentLabel.slice(1);
    return `${label} $${currentPrice.toLocaleString("es-AR")} — Conseguí tu entrada`;
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
          url: "/comprar-entradas/ct-kiki.jpg",
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
      images: ["/comprar-entradas/ct-kiki.jpg"],
    },
  };
}

export default function HomePage() {
  return <HomePageClient eventConfig={getEventConfig()} />;
}
