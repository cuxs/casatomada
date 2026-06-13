"use client";

interface SectionHeaderProps {
  onBack: () => void;
  backSide?: "left" | "right" | "up";
}

export default function SectionHeader({ onBack, backSide }: SectionHeaderProps) {
  return (
    <>
      <div className="sticky top-0 z-50 flex justify-between items-start px-6 py-5 pointer-events-none">
        <button type="button" onClick={onBack} aria-label="Ir al inicio" className="pointer-events-auto cursor-pointer bg-transparent border-0 p-0">
          <img src="/svg/loguito-casa-tomada.svg" alt="casa tomada" width={838} height={394} className="h-9 opacity-85" />
        </button>
        <img src="/svg/arte-y-resistencia.svg" alt="arte y resistencia" width={968} height={105} className="h-[13px] opacity-80 mt-1.5" />
      </div>

      {backSide && (
        // The section wrappers in home-page-client animate with `transform`,
        // which makes `position: fixed` descendants scroll away with the
        // content instead of staying put. `sticky top-0 h-0` re-anchors this
        // overlay to the scroll container's viewport without taking up space,
        // so the button stays reachable from anywhere in the scrolled content.
        <div className="sticky top-0 h-0 z-50">
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            style={
              backSide === "left"
                ? { top: "50vh", left: 0, transform: "translateY(-50%)" }
                : backSide === "right"
                ? { top: "50vh", right: 0, transform: "translateY(-50%)" }
                : { top: 0, left: "50%", transform: "translateX(-50%)" }
            }
            className={`absolute flex items-center justify-center cursor-pointer bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 hover:bg-white/20 hover:text-white transition-colors ${
              backSide === "left"
                ? "w-10 h-16 rounded-r-2xl"
                : backSide === "right"
                ? "w-10 h-16 rounded-l-2xl"
                : "w-16 h-10 rounded-b-2xl"
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
        </div>
      )}
    </>
  );
}
