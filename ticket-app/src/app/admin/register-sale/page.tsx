"use client";

import Link from "next/link";
import { useState } from "react";
import BuyersSummary from "./buyers-summary";

interface SaleResult {
  qrDataUrl: string;
  codeWord: string;
  qrToken: string;
  ticketCount: number;
}

const PRICES = [10000, 13000, 15000];

function getCurrentPrice(): number {
  const now = new Date();
  if (now < new Date("2026-06-24T03:00:00Z")) return 10000;
  if (now < new Date("2026-07-02T03:00:00Z")) return 13000;
  return 15000;
}

export default function RegisterSalePage() {
  const [buyerName, setBuyerName] = useState("");
  const [price, setPrice] = useState<number>(getCurrentPrice);
  const [ticketCount, setTicketCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaleResult | null>(null);
  const [buyersRefreshKey, setBuyersRefreshKey] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerName, price, ticketCount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Ocurrió un error. Intentá de nuevo.");
        return;
      }

      setResult({
        qrDataUrl: data.qrDataUrl,
        codeWord: data.codeWord,
        qrToken: data.qrToken,
        ticketCount: data.ticketCount,
      });
      setBuyersRefreshKey((key) => key + 1);
    } catch {
      setError("No se pudo conectar con el servidor. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function handleNewSale() {
    setBuyerName("");
    setPrice(getCurrentPrice());
    setTicketCount(1);
    setError(null);
    setResult(null);
  }

  if (result) {
    return (
      <div className="w-full max-w-md lg:max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">¡Listo!</h1>
          <p className="mt-1 text-gray-500 text-sm">
            Guardá este QR — te lo van a pedir en la entrada
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.qrDataUrl}
            alt="QR de entrada"
            className="w-56 h-56"
          />
          <p className="text-sm font-medium text-gray-700 bg-gray-100 px-4 py-2 rounded-full">
            Válido para{" "}
            <span className="font-bold">
              {result.ticketCount}{" "}
              {result.ticketCount === 1 ? "entrada" : "entradas"}
            </span>
          </p>
          <div className="w-full text-center bg-gray-900 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-300 uppercase tracking-wider">
              Tu animal
            </p>
            <p className="mt-1 text-lg font-bold text-white capitalize">
              {result.codeWord}
            </p>
          </div>
          <div className="w-full text-center bg-gray-900 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-300 uppercase tracking-wider">
              Tu código
            </p>
            <p className="mt-1 text-lg font-bold text-white tracking-widest">
              {result.qrToken.slice(-3).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleNewSale}
            className="w-full px-4 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Registrar otra compra
          </button>
          <Link
            href="/admin/sales"
            className="block w-full text-center px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Ver todas las ventas
          </Link>
        </div>

        <BuyersSummary refreshKey={buyersRefreshKey} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md lg:max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Registrar compra</h1>
        <p className="mt-1 text-gray-500 text-sm">
          Completá los datos y generamos la entrada
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5"
      >
        <div className="space-y-1.5">
          <label
            htmlFor="buyerName"
            className="block text-sm font-medium text-gray-700"
          >
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            id="buyerName"
            type="text"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            placeholder="Nombre y apellido"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700"
          >
            Precio
          </label>
          <select
            id="price"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
          >
            {PRICES.map((p) => (
              <option key={p} value={p}>
                ${p.toLocaleString("es-AR")}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="ticketCount"
            className="block text-sm font-medium text-gray-700"
          >
            Válido por
          </label>
          <input
            id="ticketCount"
            type="number"
            min={1}
            step={1}
            value={ticketCount}
            onChange={(e) =>
              setTicketCount(Math.max(1, Math.floor(Number(e.target.value))))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !buyerName.trim()}
          className="w-full px-4 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generando entrada...
            </span>
          ) : (
            "Confirmar compra"
          )}
        </button>
      </form>

      <BuyersSummary refreshKey={buyersRefreshKey} />

      <Link
        href="/admin/sales"
        className="block w-full text-center text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        Ver detalle de todas las ventas →
      </Link>
    </div>
  );
}
