import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-6 gap-6">
      <img
        src="/svg/loguito-casa-tomada.svg"
        alt="casa tomada"
        className="h-10 opacity-85"
      />
      <p
        className="text-xl md:text-2xl max-w-md"
        style={{ fontFamily: "var(--font-space-mono), monospace" }}
      >
        Te pasaste? esta bien, a veces hay que pasarse para saber hasta donde
        llegar :)
      </p>
      <Link
        href="/"
        className="border border-white/20 rounded-full px-5 py-2 text-sm uppercase tracking-wide hover:bg-white/10 transition-colors"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
