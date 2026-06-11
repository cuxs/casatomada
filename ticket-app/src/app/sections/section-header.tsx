"use client";

interface SectionHeaderProps {
  onBack: () => void;
  backSide?: "left" | "right" | "up";
}

export default function SectionHeader({ onBack, backSide }: SectionHeaderProps) {
  return (
    <>
      <div className="sticky top-0 z-50 flex justify-between items-start px-6 py-5 pointer-events-none">
        <img src="/svg/loguito-casa-tomada.svg" alt="casa tomada" className="h-9 opacity-85" />
        <img src="/svg/arte-y-resistencia.svg" alt="arte y resistencia" className="h-[13px] opacity-80 mt-1.5" />
      </div>

      {backSide && (
        <button
          onClick={onBack}
          aria-label="Volver"
          className={`fixed z-50 flex items-center justify-center cursor-pointer bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 hover:bg-white/20 hover:text-white transition-colors ${
            backSide === "left"
              ? "top-1/2 -translate-y-1/2 left-0 w-10 h-16 rounded-r-2xl"
              : backSide === "right"
              ? "top-1/2 -translate-y-1/2 right-0 w-10 h-16 rounded-l-2xl"
              : "top-0 left-1/2 -translate-x-1/2 w-16 h-10 rounded-b-2xl"
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {backSide === "left" && <polyline points="15 18 9 12 15 6" />}
            {backSide === "right" && <polyline points="9 18 15 12 9 6" />}
            {backSide === "up" && <polyline points="18 15 12 9 6 15" />}
          </svg>
        </button>
      )}
    </>
  );
}
