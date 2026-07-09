import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s — Guardarropa · Casa Tomada",
    default: "Guardarropa — Casa Tomada",
  },
  robots: { index: false, follow: false },
};

export default function GuardarropaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 h-14 border-b border-gray-200 bg-white">
        <Link href="/guardarropa" className="flex flex-col leading-tight">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            Casa Tomada
          </span>
          <span className="font-epilogue font-bold text-gray-900 text-sm tracking-tight">
            Guardarropa
          </span>
        </Link>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
