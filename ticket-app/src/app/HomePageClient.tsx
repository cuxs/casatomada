"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventConfig } from "@/config";
import EntradasSection from "./sections/EntradasSection";
import ManifiestaSection from "./sections/ManifiestaSection";
import RizomaSection from "./sections/RizomaSection";

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
const PANEL_TRANSITION = "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)";

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

      // Ignore if mostly vertical (scrolling)
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
        setSwipe({ status: "idle" }); // spring back
      }
      touchStart.current = null;
    },
    [goBack]
  );

  // Compute transform for a swipeable panel
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

  function swipeableTransition(panel: SwipePanel): string {
    return swipe.status === "dragging" && swipe.panel === panel
      ? "none"
      : PANEL_TRANSITION;
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
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", backgroundColor: "#000" }}>

      {/* ===== HERO ===== */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: heroX,
          transition: PANEL_TRANSITION,
          zIndex: section === "hero" || section === "entradas" ? 10 : 5,
          overflow: "hidden",
        }}
      >
        {LANDING_IMAGES.map((src, i) => (
          <div
            key={src}
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: i === bgIndex ? 1 : 0,
              transition: "opacity 1.5s ease",
            }}
          />
        ))}
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.45)" }} />

        <div
          style={{
            position: "relative",
            zIndex: 10,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "10vh 6vw 8vh",
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-epilogue), sans-serif",
                fontWeight: 700,
                fontSize: "clamp(90px, 23vw, 230px)",
                lineHeight: 0.88,
                letterSpacing: "-0.1em",
                color: "white",
                mixBlendMode: "exclusion",
                transform: section === "entradas" ? "translateX(-150%)" : "translateX(0)",
                transition: PANEL_TRANSITION,
              }}
            >
              casa
            </div>
            <div
              style={{
                fontFamily: "var(--font-epilogue), sans-serif",
                fontWeight: 700,
                fontSize: "clamp(75px, 20vw, 195px)",
                lineHeight: 0.88,
                letterSpacing: "-0.1em",
                color: "white",
                mixBlendMode: "exclusion",
                transform: section === "entradas" ? "translateX(150%)" : "translateX(0)",
                transition: PANEL_TRANSITION,
              }}
            >
              tomada
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              opacity: section === "hero" ? 1 : 0,
              pointerEvents: section === "hero" ? "auto" : "none",
              transition: "opacity 0.35s ease",
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              {(
                [
                  { label: "manifiest@", onClick: () => setSection("manifiest") },
                  { label: "rizoma 001", onClick: () => setSection("rizoma") },
                ] as const
              ).map(({ label, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  style={{
                    fontFamily: "var(--font-epilogue), sans-serif",
                    fontWeight: 700,
                    fontSize: "clamp(14px, 4vw, 48px)",
                    letterSpacing: "-0.05em",
                    color: "rgba(255,255,255,0.8)",
                    background: "transparent",
                    border: "1.5px solid rgba(255,255,255,0.6)",
                    borderRadius: 100,
                    padding: "10px 22px",
                    cursor: "pointer",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSection("entradas")}
              className="entradas-animated"
              style={{
                fontFamily: "var(--font-epilogue), sans-serif",
                fontWeight: 700,
                fontSize: "clamp(42px, 11vw, 105px)",
                letterSpacing: "-0.05em",
                color: "rgba(255,255,255,0.85)",
                background: "rgba(10,10,10,0.72)",
                border: "2px solid rgba(255,255,255,0.3)",
                borderRadius: 18,
                padding: "18px 0",
                cursor: "pointer",
                backdropFilter: "blur(8px)",
                width: "min(82vw, 420px)",
                display: "block",
              }}
            >
              entradas
            </button>

            <button
              onClick={() => setSection("entradas")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", padding: 4 }}
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
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "auto",
          overflowX: "hidden",
          transform: section === "entradas" ? "translateY(0)" : "translateY(100%)",
          transition: PANEL_TRANSITION,
          zIndex: section === "entradas" ? 20 : 5,
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
        onTouchStart={onTouchStart}
        onTouchMove={(e) => onTouchMove(e, "manifiest")}
        onTouchEnd={() => onTouchEnd("manifiest", "translateX(-100%)")}
        onTouchCancel={() => { setSwipe({ status: "idle" }); touchStart.current = null; }}
        style={{
          position: "absolute",
          inset: 0,
          overflowY: swipe.status === "dragging" && swipe.panel === "manifiest" ? "hidden" : "auto",
          overflowX: "hidden",
          transform: swipeableTransform("manifiest", "translateX(0)", "translateX(-100%)"),
          transition: swipeableTransition("manifiest"),
          zIndex: section === "manifiest" ? 20 : 5,
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
        style={{
          position: "absolute",
          inset: 0,
          overflowY: swipe.status === "dragging" && swipe.panel === "rizoma" ? "hidden" : "auto",
          overflowX: "hidden",
          transform: swipeableTransform("rizoma", "translateX(0)", "translateX(100%)"),
          transition: swipeableTransition("rizoma"),
          zIndex: section === "rizoma" ? 20 : 5,
        }}
      >
        <RizomaSection onBack={() => goBack("rizoma", "translateX(100%)")} />
      </div>

    </div>
  );
}
