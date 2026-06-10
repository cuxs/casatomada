"use client";

import { useState, useEffect } from "react";
import type { EventConfig } from "@/config";
import SectionHeader from "./SectionHeader";

const ENTRADAS_IMAGES = [
  "/comprar-entradas/01E.jpg",
  "/comprar-entradas/02E.jpg",
];

const ALL_TIERS = [
  { label: "early bird", price: 10000 },
  { label: "primera tanda", price: 13000 },
  { label: "segunda tanda", price: 15000 },
  { label: "entradas en puerta", price: 20000 },
];

interface PriceInfo {
  currentTierIndex: number;
  currentPrice: number;
  nextPrice: number | null;
  changeAt: Date | null;
  currentLabel: string;
}

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface EntradasSectionProps {
  eventConfig: EventConfig;
  priceInfo: PriceInfo | null;
  countdown: Countdown | null;
  aliasCopied: boolean;
  phoneCopied: boolean;
  onCopyAlias: () => void;
  onCopyPhone: () => void;
  onBack: () => void;
}

const EP = {
  fontFamily: "var(--font-epilogue), sans-serif",
} as const;

export default function EntradasSection({
  eventConfig,
  priceInfo,
  countdown,
  aliasCopied,
  phoneCopied,
  onCopyAlias,
  onCopyPhone,
  onBack,
}: EntradasSectionProps) {
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setImgIndex((i) => (i + 1) % ENTRADAS_IMAGES.length), 4000);
    return () => clearInterval(id);
  }, []);

  const currentPrice = priceInfo?.currentPrice ?? 10000;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", position: "relative" }}>
      <SectionHeader onBack={onBack} />

      {/* Screen 1: Flyer + Prices */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "100px 24px 60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background: cycling entradas images (blurred) */}
        {ENTRADAS_IMAGES.map((src, i) => (
          <div
            key={src}
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: i === imgIndex ? 0.15 : 0,
              transition: "opacity 1.5s ease",
              filter: "blur(20px)",
              transform: "scale(1.1)",
            }}
          />
        ))}
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)" }} />

        {/* Event flyer */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "min(75vw, 320px)",
            aspectRatio: "1",
            borderRadius: "50%",
            overflow: "hidden",
            marginBottom: "40px",
            border: "2px solid rgba(255,255,255,0.15)",
          }}
        >
          {ENTRADAS_IMAGES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt="evento"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
                opacity: i === imgIndex ? 1 : 0,
                transition: "opacity 1.5s ease",
              }}
            />
          ))}
        </div>

        {/* Prices */}
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 480 }}>
          {eventConfig.soldOut ? (
            <SoldOutDisplay />
          ) : (
            <PriceDisplay priceInfo={priceInfo} countdown={countdown} />
          )}
        </div>
      </div>

      {/* Screen 2: Payment instructions */}
      <div
        style={{
          minHeight: "100vh",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "100px 28px 60px",
        }}
      >
        {/* Background: 03E */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/comprar-entradas/03E.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.62)" }} />

        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 500, margin: "0 auto" }}>
          {/* Step 1 */}
          <p
            style={{
              ...EP,
              fontWeight: 700,
              fontSize: "clamp(20px, 5vw, 50px)",
              letterSpacing: "-0.01em",
              color: "rgba(255,255,255,0.9)",
              marginBottom: 8,
              lineHeight: 1.2,
            }}
          >
            1. Enviá{" "}
            <span style={{ color: "white", fontWeight: 900 }}>
              ${currentPrice.toLocaleString("es-AR")}
            </span>{" "}
            a este alias
          </p>

          <p
            style={{
              ...EP,
              fontWeight: 700,
              fontSize: "clamp(32px, 9vw, 75px)",
              letterSpacing: "-0.01em",
              color: "white",
              marginBottom: 16,
              lineHeight: 1,
            }}
          >
            {eventConfig.alias}
          </p>

          <button
            onClick={onCopyAlias}
            style={{
              ...EP,
              fontWeight: 500,
              fontSize: 16,
              color: aliasCopied ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.75)",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 100,
              padding: "8px 24px",
              cursor: "pointer",
              marginBottom: 40,
              letterSpacing: "-0.01em",
              transition: "color 0.2s",
            }}
          >
            {aliasCopied ? "¡copiado!" : "copiar el alias"}
          </button>

          {/* Step 2 */}
          <p
            style={{
              ...EP,
              fontWeight: 700,
              fontSize: "clamp(20px, 5vw, 50px)",
              letterSpacing: "-0.01em",
              color: "rgba(255,255,255,0.9)",
              marginBottom: 8,
              lineHeight: 1.2,
            }}
          >
            2. Enviá el comprobante a este número
          </p>

          <p
            style={{
              ...EP,
              fontWeight: 700,
              fontSize: "clamp(32px, 9vw, 75px)",
              letterSpacing: "-0.01em",
              color: "white",
              marginBottom: 16,
              lineHeight: 1,
            }}
          >
            {eventConfig.phone}
          </p>

          <button
            onClick={onCopyPhone}
            style={{
              ...EP,
              fontWeight: 500,
              fontSize: 16,
              color: phoneCopied ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.75)",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 100,
              padding: "8px 24px",
              cursor: "pointer",
              marginBottom: 40,
              letterSpacing: "-0.01em",
              transition: "color 0.2s",
            }}
          >
            {phoneCopied ? "¡copiado!" : "copiar el número"}
          </button>

          {/* Confirmation */}
          <p
            style={{
              ...EP,
              fontWeight: 500,
              fontSize: "clamp(16px, 4vw, 30px)",
              letterSpacing: "-0.01em",
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.4,
              textAlign: "center",
            }}
          >
            Una vez completados los pasos te va a llegar un QR con la entrada a tu whatsapp
          </p>
        </div>
      </div>
    </div>
  );
}

function PriceDisplay({
  priceInfo,
  countdown,
}: {
  priceInfo: PriceInfo | null;
  countdown: Countdown | null;
}) {
  if (!priceInfo) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
        <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const activeTier = ALL_TIERS[priceInfo.currentTierIndex];
  const futureTiers = ALL_TIERS.slice(priceInfo.currentTierIndex + 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Active tier – big pill */}
      <div
        style={{
          backgroundColor: "rgba(10,10,10,0.85)",
          border: "2px solid rgba(255,255,255,0.25)",
          borderRadius: 20,
          padding: "20px 28px",
          textAlign: "center",
          backdropFilter: "blur(8px)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-epilogue), sans-serif",
            fontWeight: 700,
            fontSize: "clamp(28px, 8vw, 85px)",
            letterSpacing: "-0.05em",
            color: "white",
            lineHeight: 1,
            margin: 0,
          }}
        >
          {activeTier.label} ${activeTier.price.toLocaleString("es-AR")}
        </p>

        {countdown && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontFamily: "var(--font-epilogue), sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 6px" }}>
              sube a ${priceInfo.nextPrice!.toLocaleString("es-AR")} en:
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
              {[
                { v: countdown.days, l: "días" },
                { v: countdown.hours, l: "hs" },
                { v: countdown.minutes, l: "min" },
                { v: countdown.seconds, l: "seg" },
              ].map(({ v, l }) => (
                <div key={l} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-epilogue), sans-serif", fontWeight: 700, fontSize: 22, color: "white", fontVariantNumeric: "tabular-nums", minWidth: 32, textAlign: "center" }}>
                    {String(v).padStart(2, "0")}
                  </span>
                  <span style={{ fontFamily: "var(--font-epilogue), sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Future tiers */}
      {futureTiers.length > 0 && (
        <div
          style={{
            border: "1.5px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            padding: "16px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        >
          {futureTiers.map((tier) => (
            <p
              key={tier.label}
              style={{
                fontFamily: "var(--font-epilogue), sans-serif",
                fontWeight: 500,
                fontSize: "clamp(20px, 5.5vw, 60px)",
                letterSpacing: "-0.05em",
                color: "rgba(255,255,255,0.45)",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {tier.label} ${tier.price.toLocaleString("es-AR")}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function SoldOutDisplay() {
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <p
        style={{
          fontFamily: "var(--font-epilogue), sans-serif",
          fontWeight: 500,
          fontSize: "clamp(16px, 4vw, 24px)",
          color: "rgba(255,255,255,0.6)",
          margin: "0 0 20px",
          letterSpacing: "-0.05em",
        }}
      >
        fantasiaaaaaaaaaaaaaaah
      </p>
      <p
        style={{
          fontFamily: "var(--font-epilogue), sans-serif",
          fontWeight: 900,
          fontSize: "clamp(80px, 22vw, 160px)",
          letterSpacing: "-0.05em",
          color: "#e62120",
          lineHeight: 0.9,
          margin: "0 0 24px",
        }}
      >
        sold out
      </p>
      <p
        style={{
          fontFamily: "var(--font-epilogue), sans-serif",
          fontWeight: 500,
          fontSize: "clamp(20px, 5vw, 60px)",
          letterSpacing: "-0.05em",
          color: "rgba(255,255,255,0.7)",
          margin: 0,
        }}
      >
        gracias, nos vemos en la pista we
      </p>
    </div>
  );
}
