"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventConfig } from "@/config";
import EntradasSection from "./sections/tickets-section";
import ManifiestaSection from "./sections/manifesta-section";
import RizomaSection from "./sections/rizoma-section";

const LANDING_IMAGES = [
  "/fotos-landing/002.png",
  "/fotos-landing/003.png",
  "/fotos-landing/004.png",
  "/fotos-landing/005.png",
  "/fotos-landing/006.png",
  "/fotos-landing/007.png",
  "/fotos-landing/008.png",
  "/fotos-landing/009.png",
];

const PRICE_CHANGES = [
  { at: new Date("2026-06-24T03:00:00Z"), toPrice: 13000 },
  { at: new Date("2026-07-01T03:00:00Z"), toPrice: 15000 },
];

function getPriceInfo(now: Date) {
  if (now < PRICE_CHANGES[0].at) {
    return { currentTierIndex: 0, currentPrice: 10000, nextPrice: 13000, changeAt: PRICE_CHANGES[0].at, currentLabel: "early bird" };
  }
  if (now < PRICE_CHANGES[1].at) {
    return { currentTierIndex: 1, currentPrice: 13000, nextPrice: 15000, changeAt: PRICE_CHANGES[1].at, currentLabel: "primera tanda" };
  }
  return { currentTierIndex: 2, currentPrice: 15000, nextPrice: null, changeAt: null, currentLabel: "segunda tanda" };
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
type SwipePanel = "manifiest" | "rizoma";
type SwipeState =
  | { status: "idle" }
  | { status: "dragging"; panel: SwipePanel; delta: number }
  | { status: "exiting"; panel: SwipePanel; x: string };

const SWIPE_THRESHOLD = 80;
const EXIT_DURATION = 400;

export default function HomePageClient({ eventConfig }: { eventConfig: EventConfig }) {
  const [section, setSection] = useState<Section>("hero");
  const [swipe, setSwipe] = useState<SwipeState>({ status: "idle" });
  const [bgIndex, setBgIndex] = useState(0);
  const [now, setNow] = useState<Date | null>(null);
  const [aliasCopied, setAliasCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);

  const entradasRef = useRef<HTMLDivElement>(null);
  const manifiestaRef = useRef<HTMLDivElement>(null);
  const rizomaRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swipeRef = useRef(swipe);
  swipeRef.current = swipe;

  useEffect(() => {
    const id = setInterval(() => setBgIndex((i) => (i + 1) % LANDING_IMAGES.length), 5000);
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

  const goBack = useCallback(
    (panel: SwipePanel, exitX: string) => {
      setSwipe({ status: "exiting", panel, x: exitX });
      setTimeout(() => {
        setSection("hero");
        setSwipe({ status: "idle" });
      }, EXIT_DURATION);
    },
    []
  );

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent, panel: SwipePanel) => {
      if (!touchStart.current) return;
      const dx = e.touches[0].clientX - touchStart.current.x;
      const dy = e.touches[0].clientY - touchStart.current.y;

      if (Math.abs(dy) > Math.abs(dx) * 1.2) return;

      // manifiest@ exits left (swipe left, dx < 0)
      // rizoma exits right (swipe right, dx > 0)
      const relevant =
        (panel === "manifiest" && dx < 0) ||
        (panel === "rizoma" && dx > 0);
      if (!relevant) return;

      setSwipe({ status: "dragging", panel, delta: dx });
    },
    []
  );

  const onTouchEnd = useCallback(
    (panel: SwipePanel, exitX: string) => {
      const s = swipeRef.current;
      if (s.status !== "dragging" || s.panel !== panel) {
        setSwipe({ status: "idle" });
        touchStart.current = null;
        return;
      }
      const { delta } = s;
      const didSwipe =
        panel === "manifiest" ? delta < -SWIPE_THRESHOLD : delta > SWIPE_THRESHOLD;

      if (didSwipe) {
        goBack(panel, exitX);
      } else {
        setSwipe({ status: "idle" });
      }
      touchStart.current = null;
    },
    [goBack]
  );

  function swipeableTransform(
    panel: SwipePanel,
    defaultVisible: string,
    defaultHidden: string
  ): string {
    if (swipe.status === "dragging" && swipe.panel === panel) {
      return `translateX(${swipe.delta}px)`;
    }
    if (swipe.status === "exiting" && swipe.panel === panel) {
      return swipe.x;
    }
    return section === panel ? defaultVisible : defaultHidden;
  }

  function swipeableTransition(panel: SwipePanel): string | undefined {
    return swipe.status === "dragging" && swipe.panel === panel ? "none" : undefined;
  }

  const priceInfo = now ? getPriceInfo(now) : null;
  const msLeft = priceInfo?.changeAt ? priceInfo.changeAt.getTime() - now!.getTime() : null;
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
    section === "manifiest" || (swipe.status === "exiting" && swipe.panel === "manifiest")
      ? "translateX(100%)"
      : section === "rizoma" || (swipe.status === "exiting" && swipe.panel === "rizoma")
      ? "translateX(-100%)"
      : "translateX(0)";

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">

      {/* ===== HERO ===== */}
      <div
        className={`absolute inset-0 transition-transform duration-[600ms] ease-in-out overflow-hidden ${section === "hero" || section === "entradas" ? "z-10" : "z-[5]"}`}
        style={{ transform: heroX }}
      >
        {LANDING_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out"
            style={{ backgroundImage: `url(${src})`, opacity: i === bgIndex ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10 h-full flex flex-col justify-between py-[8vh] px-[5vw]">
          <div className="flex-1 flex flex-col justify-center">
            <div
              className="font-epilogue font-bold leading-[0.88] tracking-[-0.1em] text-white mix-blend-exclusion transition-transform duration-[600ms] ease-in-out"
              style={{
                fontSize: "clamp(120px, 31vw, 240px)",
                transform: section === "entradas" ? "translateX(-150%)" : "translateX(0)",
              }}
            >
              casa
            </div>
            <div
              className="font-epilogue font-bold leading-[0.88] tracking-[-0.1em] text-white mix-blend-exclusion transition-transform duration-[600ms] ease-in-out"
              style={{
                fontSize: "clamp(100px, 26vw, 200px)",
                transform: section === "entradas" ? "translateX(150%)" : "translateX(0)",
              }}
            >
              tomada
            </div>
          </div>

          {/* Pills + entradas button */}
          <div
            className={`self-center flex flex-col items-center gap-3 w-[min(76vw,320px)] transition-opacity duration-[350ms] ease-in-out ${section === "hero" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          >
            <div className="flex gap-2.5 w-full">
              {(
                [
                  { label: "manifiest@", onClick: () => setSection("manifiest") },
                  { label: "rizoma 001", onClick: () => setSection("rizoma") },
                ] as const
              ).map(({ label, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="flex-1 font-epilogue font-bold text-[17px] tracking-[-0.04em] text-white/85 bg-transparent border-[1.5px] border-white/55 rounded-full py-[11px] px-2 cursor-pointer backdrop-blur-sm whitespace-nowrap"
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSection("entradas")}
              className="entradas-animated font-epilogue font-bold tracking-[-0.05em] text-white/90 bg-[rgba(10,10,10,0.75)] border-2 border-white/35 rounded-2xl py-[14px] cursor-pointer backdrop-blur-sm w-full block"
              style={{ fontSize: "clamp(36px, 9.5vw, 46px)" }}
            >
              entradas
            </button>

            <button
              onClick={() => setSection("entradas")}
              className="bg-transparent border-0 cursor-pointer text-white/50 p-1"
              aria-label="Ver más"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        style={{ transform: section === "entradas" ? "translateY(0)" : "translateY(100%)" }}
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
        onTouchStart={onTouchStart}
        onTouchMove={(e) => onTouchMove(e, "manifiest")}
        onTouchEnd={() => onTouchEnd("manifiest", "translateX(-100%)")}
        onTouchCancel={() => { setSwipe({ status: "idle" }); touchStart.current = null; }}
        className={`absolute inset-0 overflow-x-hidden transition-transform duration-[600ms] ease-in-out ${section === "manifiest" ? "z-20" : "z-[5]"} ${swipe.status === "dragging" && swipe.panel === "manifiest" ? "overflow-y-hidden" : "overflow-y-auto"}`}
        style={{
          transform: swipeableTransform("manifiest", "translateX(0)", "translateX(-100%)"),
          transition: swipeableTransition("manifiest"),
        }}
      >
        <ManifiestaSection onBack={() => goBack("manifiest", "translateX(-100%)")} />
      </div>

      {/* ===== RIZOMA ===== */}
      <div
        ref={rizomaRef}
        onTouchStart={onTouchStart}
        onTouchMove={(e) => onTouchMove(e, "rizoma")}
        onTouchEnd={() => onTouchEnd("rizoma", "translateX(100%)")}
        onTouchCancel={() => { setSwipe({ status: "idle" }); touchStart.current = null; }}
        className={`absolute inset-0 overflow-x-hidden transition-transform duration-[600ms] ease-in-out ${section === "rizoma" ? "z-20" : "z-[5]"} ${swipe.status === "dragging" && swipe.panel === "rizoma" ? "overflow-y-hidden" : "overflow-y-auto"}`}
        style={{
          transform: swipeableTransform("rizoma", "translateX(0)", "translateX(100%)"),
          transition: swipeableTransition("rizoma"),
        }}
      >
        <RizomaSection onBack={() => goBack("rizoma", "translateX(100%)")} />
      </div>

    </div>
  );
}
