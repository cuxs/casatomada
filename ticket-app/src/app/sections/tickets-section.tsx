"use client";

import Image from "next/image";
import { useRef } from "react";
import type { EventConfig } from "@/config";
import SectionHeader from "./section-header";

const ALL_TIERS = [
  { label: "pajarito tempranero", price: 10000 },
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
  const currentPrice = priceInfo?.currentPrice ?? 10000;
  const paymentRef = useRef<HTMLDivElement>(null);

  function scrollToPayment() {
    paymentRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="relative bg-[#080808]">
      <SectionHeader onBack={onBack} backSide="up" />

      {/* ── Screen 1: Flyer + Prices ── */}
      <div className="relative flex flex-col items-center justify-center min-h-screen pt-[26px] px-5 pb-12 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center brightness-50"
          style={{ backgroundImage: "url('/comprar-entradas/01E.webp')" }}
        />

        <Image
          src="/comprar-entradas/02E.webp"
          alt="evento"
          width={760}
          height={950}
          className="relative z-[1] w-[min(86vw,380px)] block mb-7"
        />

        <div className="relative z-[1] w-[min(86vw,380px)]">
          {eventConfig.soldOut ? (
            <SoldOutDisplay />
          ) : (
            <PriceDisplay
              priceInfo={priceInfo}
              countdown={countdown}
              onBuyNow={scrollToPayment}
            />
          )}
        </div>
      </div>

      {/* ── Screen 2: Payment instructions ── */}
      <div
        ref={paymentRef}
        className="relative flex flex-col justify-center min-h-screen pt-[100px] px-7 pb-[60px]"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/comprar-entradas/03E.webp')",
            backgroundSize: "290% auto",
            backgroundPosition: "50% 55%",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="absolute inset-0 bg-black/[0.62]" />

        <div className="relative z-[1] w-full max-w-[500px] mx-auto">
          <p className="font-epilogue font-bold text-[clamp(20px,5vw,50px)] tracking-[-0.01em] text-white/90 mb-2 leading-[1.2]">
            1. Enviá{" "}
            <span className="text-white font-black">
              ${currentPrice.toLocaleString("es-AR")}
            </span>{" "}
            a este alias
          </p>

          <p className="font-epilogue font-bold text-[clamp(32px,9vw,75px)] tracking-[-0.01em] text-white mb-4 leading-none">
            {eventConfig.alias}
          </p>

          <button
            type="button"
            onClick={onCopyAlias}
            className={`font-epilogue font-medium text-base rounded-full py-2 px-6 cursor-pointer mb-10 tracking-[-0.01em] transition-colors bg-white/[0.18] border border-white/30 ${aliasCopied ? "text-white/50" : "text-white/75"}`}
          >
            {aliasCopied ? "¡copiado!" : "copiar el alias"}
          </button>

          <p className="font-epilogue font-bold text-[clamp(20px,5vw,50px)] tracking-[-0.01em] text-white/90 mb-2 leading-[1.2]">
            2. Enviá el comprobante a este número
          </p>

          <p className="font-epilogue font-bold text-[clamp(32px,9vw,75px)] tracking-[-0.01em] text-white mb-4 leading-none">
            {eventConfig.phone}
          </p>

          <button
            type="button"
            onClick={onCopyPhone}
            className={`font-epilogue font-medium text-base rounded-full py-2 px-6 cursor-pointer mb-10 tracking-[-0.01em] transition-colors bg-white/[0.18] border border-white/30 ${phoneCopied ? "text-white/50" : "text-white/75"}`}
          >
            {phoneCopied ? "¡copiado!" : "copiar el número"}
          </button>

          <p className="font-epilogue font-medium text-[clamp(16px,4vw,30px)] tracking-[-0.01em] text-white/70 leading-[1.4] text-center">
            Una vez completados los pasos te va a llegar un QR con la entrada a
            tu whatsapp
          </p>

          <button
            type="button"
            onClick={onBack}
            className="mt-12 mx-auto flex items-center gap-2.5 font-epilogue font-medium text-base tracking-[-0.01em] text-white/60 bg-white/[0.16] border border-white/25 rounded-full py-3 px-7 cursor-pointer hover:bg-white/25 hover:text-white/80 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
            volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}

function PriceDisplay({
  priceInfo,
  countdown,
  onBuyNow,
}: {
  priceInfo: PriceInfo | null;
  countdown: Countdown | null;
  onBuyNow: () => void;
}) {
  if (!priceInfo) return null;

  const pastTiers = ALL_TIERS.slice(0, priceInfo.currentTierIndex);
  const activeTier = ALL_TIERS[priceInfo.currentTierIndex];
  const futureTiers = ALL_TIERS.slice(priceInfo.currentTierIndex + 1);

  return (
    <div className="flex flex-col">
      {pastTiers.map((tier) => (
        <p
          key={tier.label}
          className="font-epilogue font-medium text-[clamp(18px,5vw,26px)] tracking-[-0.05em] text-white/40 line-through m-0 leading-[1.8] text-center"
        >
          {tier.label} ${tier.price.toLocaleString("es-AR")}
        </p>
      ))}

      <button
        type="button"
        onClick={onBuyNow}
        className="entradas-glow bg-[rgba(8,8,8,0.88)] border-2 border-white/[0.28] rounded-[18px] px-6 py-4 text-center backdrop-blur-sm mb-5 cursor-pointer w-full"
      >
        <p className="font-epilogue font-bold text-[clamp(24px,7vw,38px)] tracking-[-0.05em] text-white leading-none m-0">
          {activeTier.label} ${activeTier.price.toLocaleString("es-AR")}
        </p>

        {countdown && (
          <div className="mt-2.5">
            <p className="font-epilogue text-xs text-white/45 m-0 mb-1.5 tracking-[-0.01em]">
              {/* biome-ignore lint/style/noNonNullAssertion: countdown is only set when nextPrice is set */}
              sube a ${priceInfo.nextPrice!.toLocaleString("es-AR")} en:
            </p>
            <div className="flex justify-center gap-3.5">
              {[
                { v: countdown.days, l: "días" },
                { v: countdown.hours, l: "hs" },
                { v: countdown.minutes, l: "min" },
                { v: countdown.seconds, l: "seg" },
              ].map(({ v, l }) => (
                <div key={l} className="flex flex-col items-center">
                  <span className="font-epilogue font-bold text-xl text-white tabular-nums min-w-7 text-center">
                    {String(v).padStart(2, "0")}
                  </span>
                  <span className="font-epilogue text-[10px] text-white/35">
                    {l}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </button>

      {futureTiers.map((tier) => (
        <p
          key={tier.label}
          className="font-epilogue font-medium text-[clamp(18px,5vw,26px)] tracking-[-0.05em] text-white/40 m-0 leading-[1.8] text-center"
        >
          {tier.label} ${tier.price.toLocaleString("es-AR")}
        </p>
      ))}
    </div>
  );
}

function SoldOutDisplay() {
  return (
    <div className="text-center py-5">
      <p className="font-epilogue font-medium text-[clamp(16px,4vw,24px)] text-white/60 m-0 mb-5 tracking-[-0.05em]">
        fantasiaaaaaaaaaaaaaaah
      </p>
      <p className="font-epilogue font-black text-[clamp(80px,22vw,160px)] tracking-[-0.05em] text-[#e62120] leading-[0.9] m-0 mb-6">
        sold out
      </p>
      <p className="font-epilogue font-medium text-[clamp(20px,5vw,60px)] tracking-[-0.05em] text-white/70 m-0">
        gracias, nos vemos en la pista we
      </p>
    </div>
  );
}
