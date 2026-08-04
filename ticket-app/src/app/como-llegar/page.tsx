"use client";

import { useRouter } from "next/navigation";
import SectionHeader from "@/app/sections/section-header";

export default function ComoLlegarPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <SectionHeader onBack={() => router.push("/")} />

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <p className="font-epilogue font-medium text-[clamp(20px,5vw,32px)] tracking-[-0.02em] text-white/80 text-center leading-[1.4] max-w-[520px]">
          La dirección de este rizoma 002 se comparte una vez que se haya
          enviado el comprobante, y el mismo día del evento :)
        </p>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-12 mx-auto flex items-center gap-2.5 font-epilogue font-medium text-base tracking-[-0.01em] text-white/60 bg-white/[0.16] border border-white/25 rounded-full py-3 px-7 cursor-pointer hover:bg-white/25 hover:text-white/80 transition-colors"
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
            <polyline points="15 18 9 12 15 6" />
          </svg>
          volver al inicio
        </button>
      </main>
    </div>
  );
}
