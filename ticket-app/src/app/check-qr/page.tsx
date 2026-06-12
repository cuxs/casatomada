"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ANIMALS, COLORS, PLACES } from "@/lib/code-words";

interface SaleInfo {
  found: boolean;
  used: boolean;
  buyerName: string;
  ticketCount: number;
  usedAt: string | null;
}

interface CodeResult {
  found: boolean;
  used: boolean;
  buyerName: string;
  ticketCount: number;
  usedAt: string | null;
  qrToken: string;
}

function CheckQRContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [token, setToken] = useState(tokenFromUrl ?? "");
  const [manualInput, setManualInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [sale, setSale] = useState<SaleInfo | null>(null);
  const [checked, setChecked] = useState(false);

  const [animal, setAnimal] = useState("");
  const [color, setColor] = useState("");
  const [place, setPlace] = useState("");
  const [tokenSuffix, setTokenSuffix] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeChecked, setCodeChecked] = useState(false);
  const [codeResult, setCodeResult] = useState<CodeResult | null>(null);
  const [codeMarking, setCodeMarking] = useState(false);
  const [codeJustMarked, setCodeJustMarked] = useState(false);

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
    if (!token) return;
    setMarking(true);
    try {
      const res = await fetch(`/api/qr/${encodeURIComponent(token.trim())}`, {
        method: "POST",
      });
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
    setToken(t);
    fetchSale(t);
  }

  // Auto-lookup once animal, color, place and the 3-character suffix are all set
  useEffect(() => {
    if (!animal || !color || !place || tokenSuffix.length !== 3) {
      setCodeResult(null);
      setCodeChecked(false);
      setCodeJustMarked(false);
      return;
    }

    let cancelled = false;
    const codeWord = `${animal} ${color} ${place}`;

    setCodeLoading(true);
    setCodeChecked(false);
    setCodeResult(null);
    setCodeJustMarked(false);

    fetch(`/api/qr/lookup?codeWord=${encodeURIComponent(codeWord)}&suffix=${encodeURIComponent(tokenSuffix)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setCodeResult(data);
      })
      .catch(() => {
        if (!cancelled) setCodeResult(null);
      })
      .finally(() => {
        if (!cancelled) {
          setCodeLoading(false);
          setCodeChecked(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [animal, color, place, tokenSuffix]);

  async function markCodeAsUsed() {
    if (!codeResult?.qrToken) return;
    setCodeMarking(true);
    try {
      const res = await fetch(`/api/qr/${encodeURIComponent(codeResult.qrToken)}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setCodeResult((prev) => (prev ? { ...prev, used: data.used, usedAt: data.usedAt } : prev));
        setCodeJustMarked(true);
      }
    } finally {
      setCodeMarking(false);
    }
  }

  function resetCodeSearch() {
    setAnimal("");
    setColor("");
    setPlace("");
    setTokenSuffix("");
    setCodeResult(null);
    setCodeChecked(false);
    setCodeJustMarked(false);
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

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            ← Volver
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Validar entrada</h1>
        </div>

        {/* Validate by "palabra clave" + last 3 characters of the token */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
            Validar por palabra clave
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={animal}
              onChange={(e) => setAnimal(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
            >
              <option value="">Animal</option>
              {ANIMALS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
            >
              <option value="">Color</option>
              {COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
            >
              <option value="">Lugar</option>
              {PLACES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={tokenSuffix}
            onChange={(e) => setTokenSuffix(e.target.value.trim().slice(0, 3))}
            placeholder="Últimos 3 caracteres del token"
            maxLength={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono uppercase text-center tracking-widest text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
          />

          {codeLoading && (
            <div className="flex justify-center py-4">
              <span className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            </div>
          )}

          {!codeLoading && codeChecked && codeResult && (
            <>
              {codeResult.found && (!codeResult.used || codeJustMarked) ? (
                <div className="space-y-3 text-center">
                  <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 space-y-1">
                    <p className="text-sm text-gray-500">Nombre</p>
                    <p className="font-semibold text-gray-900">{codeResult.buyerName}</p>
                    <p className="text-sm text-gray-500 mt-2">Entradas</p>
                    <p className="font-bold text-xl text-gray-900">{codeResult.ticketCount}</p>
                  </div>

                  {codeJustMarked ? (
                    <p className="text-2xl text-black">✅ Entrada validada</p>
                  ) : (
                    <button
                      onClick={markCodeAsUsed}
                      disabled={codeMarking}
                      className="w-full py-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 disabled:opacity-50 transition-colors"
                    >
                      {codeMarking ? (
                        <span className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin inline-block" />
                      ) : (
                        <span className="text-4xl">✅</span>
                      )}
                    </button>
                  )}

                  <button
                    onClick={resetCodeSearch}
                    className="text-black p-2 border border-gray-300 rounded-xl"
                  >
                    Validar otra entrada
                  </button>
                </div>
              ) : (
                <div className="space-y-3 text-center">
                  <p className="text-4xl">❌</p>
                  <button
                    onClick={resetCodeSearch}
                    className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Validar otra entrada
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Manual token input — shown if no token in URL or to check a different one */}
        {(!tokenFromUrl || checked) && (
          <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Pegá el token del QR"
              className="w-full sm:flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 transition"
            />
            <button
              type="submit"
              disabled={!manualInput.trim() || loading}
              className="w-full sm:w-auto px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors whitespace-nowrap"
            >
              Validar
            </button>
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
                <p className="text-red-600 text-sm">Este código no existe en el sistema.</p>
              </div>
            )}

            {/* Already used */}
            {sale.found && sale.used && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 space-y-3">
                <div className="text-4xl text-center">⚠️</div>
                <p className="text-center font-bold text-yellow-800 text-lg">QR ya utilizado</p>
                <div className="bg-white border border-yellow-100 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-semibold text-gray-900">{sale.buyerName}</p>
                </div>
                {sale.usedAt && (
                  <div className="bg-white border border-yellow-100 rounded-xl px-4 py-3 space-y-1">
                    <p className="text-sm text-gray-500">Usado el</p>
                    <p className="font-semibold text-gray-900">{formatDate(sale.usedAt)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Valid — not yet used */}
            {sale.found && !sale.used && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4">
                <div className="text-4xl text-center">✅</div>
                <p className="text-center font-bold text-green-800 text-lg">QR válido</p>

                <div className="bg-white border border-green-100 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-semibold text-gray-900">{sale.buyerName}</p>
                </div>

                <div className="bg-white border border-green-100 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-sm text-gray-500">Entradas</p>
                  <p className="font-bold text-2xl text-gray-900">{sale.ticketCount}</p>
                </div>

                <button
                  onClick={markAsUsed}
                  disabled={marking}
                  className="w-full px-4 py-4 bg-green-700 text-white font-bold text-lg rounded-xl hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {marking ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Marcando...
                    </span>
                  ) : (
                    "Marcar como usado"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function CheckQRPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </main>
    }>
      <CheckQRContent />
    </Suspense>
  );
}
