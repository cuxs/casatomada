"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  MiniMap,
  TransformComponent,
  TransformWrapper,
  useControls,
} from "react-zoom-pan-pinch";
import type { EventConfig } from "@/config";
import SectionHeader from "./section-header";

interface PriceInfo {
  currentPrice: number;
}

interface EntradasSectionProps {
  eventConfig: EventConfig;
  priceInfo: PriceInfo | null;
  saleClosed: boolean;
  aliasCopied: boolean;
  phoneCopied: boolean;
  onCopyAlias: () => void;
  onCopyPhone: () => void;
  onBack: () => void;
}

export default function EntradasSection({
  eventConfig,
  priceInfo,
  saleClosed,
  aliasCopied,
  phoneCopied,
  onCopyAlias,
  onCopyPhone,
  onBack,
}: EntradasSectionProps) {
  const currentPrice = priceInfo?.currentPrice ?? 8000;
  const paymentRef = useRef<HTMLDivElement>(null);
  const [flyerOpen, setFlyerOpen] = useState(false);

  useEffect(() => {
    if (!flyerOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setFlyerOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flyerOpen]);

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

        <button
          type="button"
          onClick={() => setFlyerOpen(true)}
          aria-label="Ampliar flyer"
          className="relative z-[1] mb-7 block cursor-zoom-in border-0 bg-transparent p-0"
        >
          <Image
            src="/comprar-entradas/02E.webp"
            alt="evento"
            width={760}
            height={950}
            className="w-[min(86vw,380px)] block shadow-[0_40px_100px_35px_rgba(0,0,0,0.95)]"
          />
        </button>

        {!saleClosed && (
          <div className="relative z-[1] w-[min(86vw,380px)]">
            {eventConfig.soldOut ? (
              <SoldOutDisplay />
            ) : (
              <PriceDisplay priceInfo={priceInfo} onBuyNow={scrollToPayment} />
            )}
          </div>
        )}
      </div>

      {/* ── Screen 2: Payment instructions ── */}
      {!saleClosed && (
        <div
          ref={paymentRef}
          className="relative flex flex-col justify-center min-h-screen pt-16 px-7 pb-10"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/comprar-entradas/02E.webp')",
            }}
          />
          <div className="absolute inset-0 bg-black/[0.62]" />

          <div className="relative z-[1] w-full max-w-[500px] mx-auto">
            <p className="font-epilogue font-bold text-[clamp(18px,4vw,30px)] tracking-[-0.01em] text-white/90 mb-2 leading-[1.2]">
              1. Enviá{" "}
              <span className="text-white font-black">
                ${currentPrice.toLocaleString("es-AR")}
              </span>{" "}
              a este alias
            </p>

            <p className="font-epilogue font-bold text-[clamp(26px,6vw,42px)] tracking-[-0.01em] text-white mb-4 leading-none">
              {eventConfig.alias}
            </p>

            <button
              type="button"
              onClick={onCopyAlias}
              className={`font-epilogue font-medium text-base rounded-full py-2 px-6 cursor-pointer mb-6 tracking-[-0.01em] transition-colors bg-[#1c1c1c] border border-white/30 ${aliasCopied ? "text-white/50" : "text-white/75"}`}
            >
              {aliasCopied ? "¡copiado!" : "copiar el alias"}
            </button>

            <p className="font-epilogue font-bold text-[clamp(18px,4vw,30px)] tracking-[-0.01em] text-white/90 mb-2 leading-[1.2]">
              2. Enviá el comprobante a este número
            </p>

            <p className="font-epilogue font-bold text-[clamp(26px,6vw,42px)] tracking-[-0.01em] text-white mb-4 leading-none">
              {eventConfig.phone}
            </p>

            <button
              type="button"
              onClick={onCopyPhone}
              className={`font-epilogue font-medium text-base rounded-full py-2 px-6 cursor-pointer mb-6 tracking-[-0.01em] transition-colors bg-[#1c1c1c] border border-white/30 ${phoneCopied ? "text-white/50" : "text-white/75"}`}
            >
              {phoneCopied ? "¡copiado!" : "copiar el número"}
            </button>

            <p className="font-epilogue font-medium text-[clamp(14px,3vw,18px)] tracking-[-0.01em] text-white/70 leading-[1.4] text-center">
              Una vez completados los pasos te va a llegar un QR con la entrada
              a tu whatsapp
            </p>

            <button
              type="button"
              onClick={onBack}
              className="mt-6 mx-auto flex items-center gap-2.5 font-epilogue font-medium text-base tracking-[-0.01em] text-white/60 bg-[#1c1c1c] border border-white/25 rounded-full py-3 px-7 cursor-pointer hover:bg-[#2a2a2a] hover:text-white/80 transition-colors"
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
      )}

      {flyerOpen && (
        <div className="fixed inset-0 z-50 bg-black/90">
          <button
            type="button"
            onClick={() => setFlyerOpen(false)}
            aria-label="Cerrar"
            className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white/80 cursor-pointer hover:bg-white/20 hover:text-white transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <TransformWrapper
            initialScale={1}
            minScale={1}
            maxScale={10}
            centerOnInit
            doubleClick={{ mode: "toggle", step: 4 }}
            wheel={{ step: 0.15 }}
            pinch={{ step: 5 }}
          >
            <TransformComponent
              wrapperClass="!w-full !h-full"
              contentClass="!w-full !h-full !flex !items-center !justify-center"
            >
              <Image
                src="/comprar-entradas/02E.webp"
                alt="evento"
                width={1080}
                height={1350}
                unoptimized
                className="max-h-[90vh] w-auto max-w-[92vw] shadow-[0_40px_100px_35px_rgba(0,0,0,0.95)]"
              />
            </TransformComponent>

            <FlyerZoomControls />

            <MiniMap
              width={90}
              height={112}
              borderColor="rgba(255,255,255,0.6)"
              className="!absolute bottom-6 right-6 z-10 overflow-hidden rounded-md border border-white/25 bg-black/60"
            >
              <Image
                src="/comprar-entradas/02E.webp"
                alt=""
                aria-hidden="true"
                width={1080}
                height={1350}
                unoptimized
              />
            </MiniMap>
          </TransformWrapper>
        </div>
      )}
    </div>
  );
}

function FlyerZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
      <button
        type="button"
        onClick={() => zoomOut()}
        aria-label="Alejar"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-xl text-white/80 cursor-pointer hover:bg-white/20 hover:text-white transition-colors"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => resetTransform()}
        aria-label="Restablecer zoom"
        className="font-epilogue flex h-11 items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 text-sm text-white/80 cursor-pointer hover:bg-white/20 hover:text-white transition-colors"
      >
        reset
      </button>
      <button
        type="button"
        onClick={() => zoomIn()}
        aria-label="Acercar"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-xl text-white/80 cursor-pointer hover:bg-white/20 hover:text-white transition-colors"
      >
        +
      </button>
    </div>
  );
}

function PriceDisplay({
  priceInfo,
  onBuyNow,
}: {
  priceInfo: PriceInfo | null;
  onBuyNow: () => void;
}) {
  if (!priceInfo) return null;

  return (
    <button
      type="button"
      onClick={onBuyNow}
      className="entradas-glow bg-[rgba(8,8,8,0.88)] border-2 border-white/[0.28] rounded-[18px] px-6 py-4 text-center backdrop-blur-sm mb-5 cursor-pointer w-full"
    >
      <p className="font-epilogue font-bold text-[clamp(24px,7vw,38px)] tracking-[-0.05em] text-white leading-none m-0">
        entradas ${priceInfo.currentPrice.toLocaleString("es-AR")}
      </p>
    </button>
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
