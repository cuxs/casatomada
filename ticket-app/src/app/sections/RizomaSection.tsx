"use client";

import SectionHeader from "./SectionHeader";

export default function RizomaSection({ onBack }: { onBack: () => void }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "100px 24px 60px",
      }}
    >
      <SectionHeader onBack={onBack} />

      {/* Video background */}
      <video
        src="/rizoma/fondo-rizoma.mp4"
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.5,
          zIndex: 0,
        }}
      />

      {/* Dark overlay */}
      <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 1 }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 600, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>

        {/* rizoma 001 title SVG */}
        <img
          src="/rizoma/titulo-rizoma-001.svg"
          alt="rizoma 001"
          style={{ width: "min(90vw, 520px)" }}
        />

        {/* Names SVG */}
        <img
          src="/rizoma/nombres.svg"
          alt="participantes"
          style={{ width: "min(80vw, 440px)", opacity: 0.8 }}
        />

        {/* Full video button */}
        <a
          href="#"
          style={{
            fontFamily: "var(--font-epilogue), sans-serif",
            fontWeight: 700,
            fontSize: "clamp(20px, 5vw, 32px)",
            letterSpacing: "-0.05em",
            color: "rgba(255,255,255,0.8)",
            background: "rgba(255,255,255,0.08)",
            border: "1.5px solid rgba(255,255,255,0.2)",
            borderRadius: 100,
            padding: "16px 48px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          full video
        </a>
      </div>
    </div>
  );
}
