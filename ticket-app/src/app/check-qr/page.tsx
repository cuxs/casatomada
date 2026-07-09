"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface SaleInfo {
  found: boolean;
  used: boolean;
  buyerName: string;
  ticketCount: number;
  usedAt: string | null;
}

// Format timestamp in Spanish
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CheckQRContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const tokenRef = useRef(tokenFromUrl ?? "");
  const [manualInput, setManualInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [sale, setSale] = useState<SaleInfo | null>(null);
  const [checked, setChecked] = useState(false);

  const fetchSale = useCallback(async (t: string) => {
    if (!t.trim()) return;
    setLoading(true);
    setChecked(false);
    setSale(null);
    try {
      const res = await fetch(`/api/qr/${encodeURIComponent(t.trim())}`);
      const data = await res.json();
      setSale(data);
    } catch {
      setSale(null);
    } finally {
      setLoading(false);
      setChecked(true);
    }
  }, []);

  // Auto-fetch if token comes from URL
  useEffect(() => {
    if (tokenFromUrl) {
      fetchSale(tokenFromUrl);
    }
  }, [tokenFromUrl, fetchSale]);

  async function markAsUsed() {
    if (!tokenRef.current) return;
    setMarking(true);
    try {
      const res = await fetch(
        `/api/qr/${encodeURIComponent(tokenRef.current.trim())}`,
        {
          method: "POST",
        },
      );
      const data = await res.json();
      if (res.ok) {
        setSale(data);
      }
    } finally {
      setMarking(false);
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = manualInput.trim();
    tokenRef.current = t;
    fetchSale(t);
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Validar entrada</h1>

        {/* Manual token input — shown if no token in URL or to check a different one */}
        {(!tokenFromUrl || checked) && (
          <form
            onSubmit={handleManualSubmit}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Pegá el token del QR"
              aria-label="Token del QR"
              className="w-full sm:flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
            />
            <Button
              type="submit"
              disabled={!manualInput.trim() || loading}
              className="w-full sm:w-auto whitespace-nowrap"
            >
              Validar
            </Button>
          </form>
        )}

        {/* Loading state */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 flex justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          </div>
        )}

        {/* Results */}
        {!loading && checked && sale && (
          <>
            {/* Not found */}
            {!sale.found && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-2">
                <div className="text-4xl">❌</div>
                <p className="font-bold text-red-700 text-lg">QR inválido</p>
                <p className="text-red-600 text-sm">
                  Este código no existe en el sistema.
                </p>
              </div>
            )}

            {/* Already used */}
            {sale.found && sale.used && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 space-y-3">
                <div className="text-4xl text-center">⚠️</div>
                <p className="text-center font-bold text-yellow-800 text-lg">
                  QR ya utilizado
                </p>
                <div className="bg-white border border-yellow-100 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-semibold text-gray-900">
                    {sale.buyerName}
                  </p>
                </div>
                {sale.usedAt && (
                  <div className="bg-white border border-yellow-100 rounded-xl px-4 py-3 space-y-1">
                    <p className="text-sm text-gray-500">Usado el</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(sale.usedAt)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Valid — not yet used */}
            {sale.found && !sale.used && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4">
                <div className="text-4xl text-center">✅</div>
                <p className="text-center font-bold text-green-800 text-lg">
                  QR válido
                </p>

                <div className="bg-white border border-green-100 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-semibold text-gray-900">
                    {sale.buyerName}
                  </p>
                </div>

                <div className="bg-white border border-green-100 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-sm text-gray-500">Entradas</p>
                  <p className="font-bold text-2xl text-gray-900">
                    {sale.ticketCount}
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={markAsUsed}
                  disabled={marking}
                  size="lg"
                  className="w-full h-auto py-4 text-lg font-bold bg-green-700 hover:bg-green-600"
                >
                  {marking ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Marcando...
                    </>
                  ) : (
                    "Marcar como usado"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
        <Button variant="outline" className="w-full text-gray-700" asChild>
          <Link href="/check-word">Validar por palabra clave →</Link>
        </Button>
      </div>
    </main>
  );
}

export default function CheckQRPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
        </main>
      }
    >
      <CheckQRContent />
    </Suspense>
  );
}
