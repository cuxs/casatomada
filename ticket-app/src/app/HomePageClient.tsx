"use client";

import { useEffect, useState } from "react";
import type { EventConfig } from "@/config";

interface ActiveBatch {
  id: string;
  name: string;
  price: number;
  total: number;
  sold: number;
  remaining: number;
}

interface HomePageClientProps {
  eventConfig: EventConfig;
}

export default function HomePageClient({ eventConfig }: HomePageClientProps) {
  const [aliasCopied, setAliasCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [activeBatch, setActiveBatch] = useState<ActiveBatch | null>(null);
  const [loadingBatch, setLoadingBatch] = useState(true);

  useEffect(() => {
    fetch("/api/batches/active")
      .then(async (res) => {
        if (!res.ok) {
          setActiveBatch(null);
          return;
        }
        const data = await res.json();
        setActiveBatch(data);
      })
      .catch(() => setActiveBatch(null))
      .finally(() => setLoadingBatch(false));
  }, []);

  function copyAlias() {
    navigator.clipboard.writeText(eventConfig.alias).then(() => {
      setAliasCopied(true);
      setTimeout(() => setAliasCopied(false), 2000);
    });
  }

  function copyPhone() {
    navigator.clipboard.writeText(eventConfig.phone).then(() => {
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    });
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Conseguí tu entrada</h1>
          <p className="mt-2 text-gray-500 text-sm">
            Realizá la transferencia y registrá tu compra
          </p>
        </div>

        {/* Payment card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Datos de pago</h2>

          {/* Alias */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Alias</p>
              <p className="text-gray-900 font-mono font-medium text-base break-all">{eventConfig.alias}</p>
            </div>
            <button
              onClick={copyAlias}
              className="w-full sm:w-auto px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors sm:min-w-[110px]"
            >
              {aliasCopied ? "¡Copiado!" : "Copiar alias"}
            </button>
          </div>

          <hr className="border-gray-100" />

          {/* Open Mercado Pago */}
          <a
            href={eventConfig.mpDeepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 transition-colors"
          >
            Abrir Mercado Pago
          </a>

          {/* Copy phone */}
          <button
            onClick={copyPhone}
            className="w-full px-4 py-3 border border-gray-300 text-gray-700 text-sm sm:text-base font-medium rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-900 focus:outline-none"
          >
            {phoneCopied ? "¡Copiado!" : `Copiar teléfono para transferir (${eventConfig.phone})`}
          </button>
        </div>

        {/* Remaining tickets */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-center">
          {loadingBatch ? (
            <div className="h-16 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            </div>
          ) : activeBatch ? (
            <>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Entradas disponibles — {activeBatch.name}
              </p>
              <p className="text-6xl font-bold text-gray-900">{activeBatch.remaining}</p>
              <p className="text-sm text-gray-400 mt-1">
                de {activeBatch.total} • ${activeBatch.price.toLocaleString("es-AR")}
              </p>
            </>
          ) : (
            <p className="text-gray-500">No hay lotes activos en este momento.</p>
          )}
        </div>
      </div>
    </main>
  );
}
