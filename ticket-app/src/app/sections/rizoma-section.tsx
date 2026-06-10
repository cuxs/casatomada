"use client";

import SectionHeader from "./section-header";

export default function RizomaSection({ onBack }: { onBack: () => void }) {
  return (
    <div className="relative min-h-screen bg-black">
      <video
        src="/rizoma/fondo-rizoma.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-50 z-0"
      />
      <div className="absolute inset-0 bg-black/45 z-[1]" />

      <div className="relative z-10">
        <SectionHeader onBack={onBack} />
      </div>

      <div className="relative z-[2] flex flex-col items-center justify-center min-h-[calc(100vh-80px)] pt-5 px-6 pb-[60px] gap-10">
        <img
          src="/rizoma/titulo-rizoma-001.svg"
          alt="rizoma 001"
          className="w-[min(90vw,520px)]"
        />

        <img
          src="/rizoma/nombres.svg"
          alt="participantes"
          className="w-[min(80vw,440px)] opacity-80"
        />

        <a
          href="https://www.youtube.com/watch?v=H_Fp5Mc9hc0&list=RDH_Fp5Mc9hc0"
          target="_blank"
          rel="noopener noreferrer"
          className="font-epilogue font-bold text-[clamp(20px,5vw,32px)] tracking-[-0.05em] text-white/80 bg-white/[0.08] border-[1.5px] border-white/20 rounded-full py-4 px-12 no-underline inline-block"
        >
          full video
        </a>
      </div>
    </div>
  );
}
