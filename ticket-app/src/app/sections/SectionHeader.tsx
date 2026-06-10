"use client";

interface SectionHeaderProps {
  onBack: () => void;
  fixed?: boolean;
}

export default function SectionHeader({ onBack, fixed = true }: SectionHeaderProps) {
  return (
    <div
      style={{
        position: fixed ? "fixed" : "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "20px 24px",
        pointerEvents: "none",
      }}
    >
      <button
        onClick={onBack}
        style={{ pointerEvents: "auto", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        aria-label="Volver"
      >
        <img src="/svg/loguito-casa-tomada.svg" alt="casa tomada" style={{ height: 40, opacity: 0.85 }} />
      </button>
      <img src="/svg/arte-y-resistencia.svg" alt="arte y resistencia" style={{ height: 20, opacity: 0.85, marginTop: 4 }} />
    </div>
  );
}
