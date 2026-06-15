"use client";

import { useCallback, useEffect, useState } from "react";
import {
  aggregateBuyers,
  type BuyerSummary,
  downloadBuyersCSV,
  downloadBuyersTXT,
  type Sale,
} from "@/lib/sales-summary";

interface BuyersSummaryProps {
  refreshKey?: number;
  sales?: Sale[] | null;
}

export default function BuyersSummary({
  refreshKey = 0,
  sales: salesProp,
}: BuyersSummaryProps) {
  const [buyers, setBuyers] = useState<BuyerSummary[] | null>(
    salesProp ? aggregateBuyers(salesProp) : null,
  );
  const [loading, setLoading] = useState(salesProp === undefined);
  const [error, setError] = useState<string | null>(null);

  const loadBuyers = useCallback(async () => {
    if (salesProp !== undefined) {
      setBuyers(salesProp ? aggregateBuyers(salesProp) : null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sales", { method: "GET" });
      const data = await res.json();

      if (!res.ok) {
        setBuyers(null);
        setError(data.error ?? "No se pudo cargar la lista de compradores.");
        return;
      }

      setBuyers(aggregateBuyers(data as Sale[]));
    } catch {
      setBuyers(null);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [salesProp]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey is a trigger to re-run loadBuyers
  useEffect(() => {
    loadBuyers();
  }, [loadBuyers, refreshKey]);

  const totalTickets = buyers?.reduce((acc, b) => acc + b.ticketCount, 0) ?? 0;

  return (
    <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Compradores</h2>
          {buyers && (
            <p className="text-sm text-gray-500 mt-0.5">
              {buyers.length} {buyers.length === 1 ? "persona" : "personas"} •{" "}
              {totalTickets} {totalTickets === 1 ? "entrada" : "entradas"}
            </p>
          )}
        </div>

        {buyers && buyers.length > 0 && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => downloadBuyersCSV(buyers)}
              className="flex-1 sm:flex-initial px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              Descargar CSV
            </button>
            <button
              type="button"
              onClick={() => downloadBuyersTXT(buyers)}
              className="flex-1 sm:flex-initial px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Descargar TXT
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="px-6 py-8 flex justify-center">
          <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="px-6 py-4">
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {!loading && !error && buyers && buyers.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500 text-sm">
          Aún no hay compradores registrados.
        </div>
      )}

      {!loading && buyers && buyers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3 text-center">Entradas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {buyers.map((buyer) => (
                <tr
                  key={buyer.buyerName}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {buyer.buyerName}
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-gray-900">
                    {buyer.ticketCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
