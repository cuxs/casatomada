"use client";

import { useEffect, useState } from "react";
import type { EventConfig } from "@/config";

const IMAGES = [
  "/fotos-landing/002.png",
  "/fotos-landing/003.png",
  "/fotos-landing/004.png",
  "/fotos-landing/005.png",
  "/fotos-landing/006.png",
  "/fotos-landing/007.png",
  "/fotos-landing/008.png",
  "/fotos-landing/009.png",
];

// Price increase dates — ART is UTC-3, so midnight ART = 03:00 UTC
const PRICE_CHANGES = [
  { at: new Date("2026-06-24T03:00:00Z"), toPrice: 13000 },
  { at: new Date("2026-07-01T03:00:00Z"), toPrice: 15000 },
];

function getPriceInfo(now: Date) {
  if (now < PRICE_CHANGES[0].at) {
    return { currentPrice: 10000, nextPrice: 13000, changeAt: PRICE_CHANGES[0].at };
  }
  if (now < PRICE_CHANGES[1].at) {
    return { currentPrice: 13000, nextPrice: 15000, changeAt: PRICE_CHANGES[1].at };
  }
  return { currentPrice: 15000, nextPrice: null, changeAt: null };
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

interface HomePageClientProps {
  eventConfig: EventConfig;
}

export default function HomePageClient({ eventConfig }: HomePageClientProps) {
  const [aliasCopied, setAliasCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    setNow(new Date());
    const clockId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockId);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setBgIndex((i) => (i + 1) % IMAGES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

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

  const priceInfo = now ? getPriceInfo(now) : null;
  const msLeft = priceInfo?.changeAt ? priceInfo.changeAt.getTime() - now!.getTime() : null;
  const countdown = msLeft !== null ? formatCountdown(msLeft) : null;

  return (
    <main className="relative min-h-screen bg-gray-900 flex flex-col items-center px-4 py-12 overflow-hidden">
      {/* Background slideshow */}
      {IMAGES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === bgIndex ? 1 : 0,
          }}
        />
      ))}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Conseguí tu entrada</h1>
          <p className="mt-2 text-white/70 text-sm">
            Realizá la transferencia y registrá tu compra
          </p>
        </div>

        {/* Payment card */}
        <div className="bg-white/95 border border-white/20 rounded-2xl shadow-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Datos de pago</h2>

          {/* Alias */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Alias</p>
              <p className="text-gray-900 font-mono font-medium text-base break-all">{eventConfig.alias}</p>
            </div>
            <button
              onClick={copyAlias}
              className="w-full sm:w-auto px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors sm:min-w-[110px]"
            >
              {aliasCopied ? "¡Copiado!" : "Copiar alias"}
            </button>
          </div>

          <hr className="border-gray-100" />

          {/* Open Mercado Pago */}
          <a
            href={eventConfig.mpDeepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors"
          >
            Abrir Mercado Pago
          </a>

          {/* Copy phone */}
          <button
            onClick={copyPhone}
            className="w-full px-4 py-3 border border-gray-300 text-gray-700 text-sm sm:text-base font-medium rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-900 focus:outline-none"
          >
            {phoneCopied ? "¡Copiado!" : `Copiar teléfono para transferir (${eventConfig.phone})`}
          </button>
        </div>

        {/* Price countdown */}
        <div className="bg-white/95 border border-white/20 rounded-2xl shadow-xl p-6 text-center">
          {!priceInfo ? (
            <div className="h-24 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Precio actual</p>
              <p className="text-5xl font-bold text-gray-900">
                ${priceInfo.currentPrice.toLocaleString("es-AR")}
              </p>
              {countdown ? (
                <div className="space-y-2 pt-1">
                  <p className="text-sm text-gray-500">
                    El precio sube a ${priceInfo.nextPrice!.toLocaleString("es-AR")} en:
                  </p>
                  <div className="flex justify-center gap-4">
                    {[
                      { value: countdown.days, label: "días" },
                      { value: countdown.hours, label: "hs" },
                      { value: countdown.minutes, label: "min" },
                      { value: countdown.seconds, label: "seg" },
                    ].map(({ value, label }) => (
                      <div key={label} className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-gray-900 tabular-nums w-10 text-center">
                          {String(value).padStart(2, "0")}
                        </span>
                        <span className="text-xs text-gray-400">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 pt-1">Precio final</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
