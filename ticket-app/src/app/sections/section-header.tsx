"use client";

interface SectionHeaderProps {
  onBack: () => void;
}

export default function SectionHeader({ onBack }: SectionHeaderProps) {
  return (
    <div className="sticky top-0 z-50 flex justify-between items-start px-6 py-5 pointer-events-none">
      <button
        onClick={onBack}
        className="pointer-events-auto bg-transparent border-0 cursor-pointer p-0"
        aria-label="Volver"
      >
        <img src="/svg/loguito-casa-tomada.svg" alt="casa tomada" className="h-9 opacity-85" />
      </button>
      <img src="/svg/arte-y-resistencia.svg" alt="arte y resistencia" className="h-[13px] opacity-80 mt-1.5" />
    </div>
  );
}
