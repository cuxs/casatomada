"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ANIMALS, COLORS, PLACES } from "@/lib/code-words";

function focusAndOpen(el: HTMLSelectElement | HTMLInputElement | null) {
  if (!el) return;
  el.focus();
  if ("showPicker" in el) {
    try {
      el.showPicker();
    } catch {
      // showPicker requires a user gesture in some browsers — focus is enough fallback
    }
  }
}

interface CodeResult {
  found: boolean;
  used: boolean;
  buyerName: string;
  ticketCount: number;
  usedAt: string | null;
  qrToken: string;
}

export default function CheckWordPage() {
  const [animal, setAnimal] = useState("");
  const [color, setColor] = useState("");
  const [place, setPlace] = useState("");
  const [tokenSuffix, setTokenSuffix] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeChecked, setCodeChecked] = useState(false);
  const [codeResult, setCodeResult] = useState<CodeResult | null>(null);
  const [codeMarking, setCodeMarking] = useState(false);
  const [codeJustMarked, setCodeJustMarked] = useState(false);

  const animalRef = useRef<HTMLSelectElement>(null);
  const colorRef = useRef<HTMLSelectElement>(null);
  const placeRef = useRef<HTMLSelectElement>(null);
  const suffixRef = useRef<HTMLInputElement>(null);

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

    fetch(
      `/api/qr/lookup?codeWord=${encodeURIComponent(codeWord)}&suffix=${encodeURIComponent(tokenSuffix)}`,
    )
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
      const res = await fetch(
        `/api/qr/${encodeURIComponent(codeResult.qrToken)}`,
        {
          method: "POST",
        },
      );
      const data = await res.json();
      if (res.ok) {
        setCodeResult((prev) =>
          prev ? { ...prev, used: data.used, usedAt: data.usedAt } : prev,
        );
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

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Validar por palabra clave
        </h1>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              ref={animalRef}
              value={animal}
              onChange={(e) => {
                setAnimal(e.target.value);
                focusAndOpen(colorRef.current);
              }}
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
              ref={colorRef}
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                focusAndOpen(placeRef.current);
              }}
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
              ref={placeRef}
              value={place}
              onChange={(e) => {
                setPlace(e.target.value);
                focusAndOpen(suffixRef.current);
              }}
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
            ref={suffixRef}
            type="text"
            value={tokenSuffix}
            onChange={(e) => setTokenSuffix(e.target.value.trim().slice(0, 3))}
            placeholder="Últimos 3 caracteres del token"
            aria-label="Últimos 3 caracteres del token"
            maxLength={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm font-mono uppercase text-center tracking-widest text-gray-900 placeholder:text-xs placeholder:normal-case placeholder:tracking-normal placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
          />

          {codeLoading && (
            <div className="flex justify-center py-4">
              <span className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            </div>
          )}

          {!codeLoading &&
            codeChecked &&
            codeResult &&
            (codeResult.found && (!codeResult.used || codeJustMarked) ? (
              <div className="space-y-3 text-center">
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-semibold text-gray-900">
                    {codeResult.buyerName}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Entradas</p>
                  <p className="font-bold text-xl text-gray-900">
                    {codeResult.ticketCount}
                  </p>
                </div>

                {codeJustMarked ? (
                  <p className="text-2xl text-black">✅ Entrada validada</p>
                ) : (
                  <Button
                    type="button"
                    onClick={markCodeAsUsed}
                    disabled={codeMarking}
                    size="lg"
                    className="w-full h-auto py-4 text-4xl border border-green-200 bg-green-50 text-green-900 hover:bg-green-100"
                    variant="outline"
                  >
                    {codeMarking ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : (
                      "Validar ✅"
                    )}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={resetCodeSearch}
                  className="w-full text-gray-700"
                >
                  Validar otra entrada
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-4xl">❌</p>
                <Button
                  type="button"
                  variant="link"
                  onClick={resetCodeSearch}
                  className="text-gray-500"
                >
                  Validar otra entrada
                </Button>
              </div>
            ))}
        </div>

        <Button variant="outline" className="w-full text-gray-700" asChild>
          <Link href="/check-qr">Validar por QR →</Link>
        </Button>
      </div>
    </main>
  );
}
