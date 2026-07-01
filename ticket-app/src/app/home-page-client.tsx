"use client";

import { useEffect, useRef, useState } from "react";
import type { EventConfig } from "@/config";
import ManifiestaSection from "./sections/manifesta-section";
import RizomaSection from "./sections/rizoma-section";
import EntradasSection from "./sections/tickets-section";

const FONT_VARIANTS: { wght: number; italic: boolean }[] = [
  { wght: 900, italic: false },
  { wght: 300, italic: true },
  { wght: 700, italic: false },
  { wght: 900, italic: true },
  { wght: 300, italic: false },
  { wght: 800, italic: true },
  { wght: 400, italic: false },
  { wght: 700, italic: true },
];

const LANDING_IMAGES = [
  "/fotos-landing/002.webp",
  "/fotos-landing/003.webp",
  "/fotos-landing/004.webp",
  "/fotos-landing/005.webp",
  "/fotos-landing/006.webp",
  "/fotos-landing/007.webp",
  "/fotos-landing/008.webp",
  "/fotos-landing/009.webp",
];

const PRICE_CHANGES = [
  { at: new Date("2026-06-24T03:00:00Z"), toPrice: 13000 },
  { at: new Date("2026-07-02T03:00:00Z"), toPrice: 15000 },
];

function getPriceInfo(now: Date) {
  if (now < PRICE_CHANGES[0].at) {
    return {
      currentTierIndex: 0,
      currentPrice: 10000,
      nextPrice: 13000,
      changeAt: PRICE_CHANGES[0].at,
      currentLabel: "pajarito tempranero",
    };
  }
  if (now < PRICE_CHANGES[1].at) {
    return {
      currentTierIndex: 1,
      currentPrice: 13000,
      nextPrice: 15000,
      changeAt: PRICE_CHANGES[1].at,
      currentLabel: "primera tanda",
    };
  }
  return {
    currentTierIndex: 2,
    currentPrice: 15000,
    nextPrice: null,
    changeAt: null,
    currentLabel: "segunda tanda",
  };
}

function formatCountdown(ms: number) {
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

type Section = "hero" | "entradas" | "manifiest" | "rizoma";

export default function HomePageClient({
  eventConfig,
}: {
  eventConfig: EventConfig;
}) {
  const [section, setSection] = useState<Section>("hero");
  const [bgIndex, setBgIndex] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const [aliasCopied, setAliasCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [fontVariant, setFontVariant] = useState(FONT_VARIANTS[0]);

  const entradasRef = useRef<HTMLDivElement>(null);
  const manifiestaRef = useRef<HTMLDivElement>(null);
  const rizomaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    LANDING_IMAGES.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const id = setInterval(
      () => setBgIndex((i) => (i + 1) % LANDING_IMAGES.length),
      5000,
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let last = 0;
    const id = setInterval(() => {
      setFontVariant(() => {
        let next: number;
        do {
          next = Math.floor(Math.random() * FONT_VARIANTS.length);
        } while (next === last);
        last = next;
        return FONT_VARIANTS[next];
      });
    }, 120);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const scrollTop = (el: HTMLDivElement | null) => {
      if (el && typeof el.scrollTo === "function") el.scrollTo(0, 0);
    };
    if (section === "entradas") scrollTop(entradasRef.current);
    if (section === "manifiest") scrollTop(manifiestaRef.current);
    if (section === "rizoma") scrollTop(rizomaRef.current);
  }, [section]);

  const priceInfo = now ? getPriceInfo(now) : null;
  const msLeft = priceInfo?.changeAt
    ? // biome-ignore lint/style/noNonNullAssertion: priceInfo is only set when now is set
      priceInfo.changeAt.getTime() - now!.getTime()
    : null;
  const countdown = msLeft !== null ? formatCountdown(msLeft) : null;

  function copyAlias() {
    navigator.clipboard.writeText(eventConfig.alias).then(() => {
      setAliasCopied(true);
      setTimeout(() => setAliasCopied(false), 2000);
    });
  }

  function copyPhone() {
    navigator.clipboard.writeText(eventConfig.phone).then(() => {
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    });
  }

  const heroX =
    section === "manifiest"
      ? "translateX(100%)"
      : section === "rizoma"
        ? "translateX(-100%)"
        : "translateX(0)";

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* ===== HERO ===== */}
      <div
        className={`absolute inset-0 transition-transform duration-[600ms] ease-in-out overflow-hidden ${section === "hero" || section === "entradas" ? "z-10" : "z-[5]"}`}
        style={{ transform: heroX }}
      >
        <div className="absolute inset-0 bg-[#2a1f1a]" />
        {LANDING_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out"
            style={{
              backgroundImage: `url(${src})`,
              opacity: i === bgIndex ? 1 : 0,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative h-full flex flex-col justify-between py-[8vh] px-[5vw]">
          <div className="flex-1 flex flex-col justify-center">
            <img
              src="/svg/loguito-casa-tomada.svg"
              alt="casa tomada"
              width={838}
              height={394}
              fetchPriority="high"
              className="w-[min(90vw,900px)] mix-blend-exclusion"
            />
          </div>

          {/* Pills + entradas button */}
          <div
            className={`self-center flex flex-col items-center gap-3 w-[min(76vw,320px)] transition-opacity duration-[350ms] ease-in-out ${section === "hero" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          >
            <div className="flex gap-2.5 w-full">
              {(
                [
                  {
                    label: "manifiest@",
                    onClick: () => setSection("manifiest"),
                  },
                  { label: "rizoma 001", onClick: () => setSection("rizoma") },
                ] as const
              ).map(({ label, onClick }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className="flex-1 font-epilogue font-bold text-[17px] tracking-[-0.04em] text-white/85 bg-transparent border-[1.5px] border-white/55 rounded-3xl py-[11px] px-2 cursor-pointer backdrop-blur-sm whitespace-nowrap"
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSection("entradas")}
              className="font-epilogue tracking-[-0.05em] text-white/90 bg-[rgba(10,10,10,0.75)] border-2 border-white/35 rounded-3xl py-[14px] cursor-pointer backdrop-blur-sm w-full block"
              style={{
                fontSize: "clamp(36px, 9.5vw, 46px)",
                fontVariationSettings: `"wght" ${fontVariant.wght}`,
                fontStyle: fontVariant.italic ? "italic" : "normal",
              }}
            >
              entradas
            </button>

            <a
              href="/como-llegar"
              className="font-epilogue text-sm text-white/45 hover:text-white/65 transition-colors tracking-[-0.02em]"
            >
              ¿cómo llegar al evento?
            </a>

            <button
              type="button"
              onClick={() => setSection("entradas")}
              className="bg-transparent border-0 cursor-pointer text-white/50 p-1"
              aria-label="Ver más"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ===== ENTRADAS ===== */}
      <div
        ref={entradasRef}
        className={`absolute inset-0 overflow-y-auto overflow-x-hidden transition-transform duration-[600ms] ease-in-out ${section === "entradas" ? "z-20" : "z-[5]"}`}
        style={{
          transform:
            section === "entradas" ? "translateY(0)" : "translateY(100%)",
        }}
      >
        <EntradasSection
          eventConfig={eventConfig}
          priceInfo={priceInfo}
          countdown={countdown}
          aliasCopied={aliasCopied}
          phoneCopied={phoneCopied}
          onCopyAlias={copyAlias}
          onCopyPhone={copyPhone}
          onBack={() => setSection("hero")}
        />
      </div>

      {/* ===== MANIFIEST@ ===== */}
      <div
        ref={manifiestaRef}
        className={`absolute inset-0 overflow-x-hidden overflow-y-auto transition-transform duration-[600ms] ease-in-out ${section === "manifiest" ? "z-20" : "z-[5]"}`}
        style={{
          transform:
            section === "manifiest" ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <ManifiestaSection onBack={() => setSection("hero")} />
      </div>

      {/* ===== RIZOMA ===== */}
      <div
        ref={rizomaRef}
        className={`absolute inset-0 overflow-x-hidden overflow-y-auto transition-transform duration-[600ms] ease-in-out ${section === "rizoma" ? "z-20" : "z-[5]"}`}
        style={{
          transform:
            section === "rizoma" ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <RizomaSection onBack={() => setSection("hero")} />
      </div>
    </div>
  );
}
