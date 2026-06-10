"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BuyersSummary from "../register-sale/buyers-summary";
import type { Sale } from "@/lib/sales-summary";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sales", { method: "GET" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Ocurrió un error al cargar las ventas.");
        setSales(null);
        return;
      }

      setSales(data);
    } catch {
      setError("No se pudo conectar con el servidor. Intentá de nuevo.");
      setSales(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
        <span className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </main>
    );
  }

  if (error || sales === null) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error ?? "No se pudieron cargar las ventas."}
          </div>
          <button
            type="button"
            onClick={loadSales}
            className="w-full px-4 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reintentar
          </button>
          <Link href="/register-sale" className="block text-sm text-gray-500 hover:text-gray-800 transition-colors">
            ← Registrar compra
          </Link>
        </div>
      </main>
    );
  }

  const totalTickets = sales.reduce((acc, s) => acc + s.ticketCount, 0);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <div>
          <Link
            href="/register-sale"
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← Registrar compra
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Ventas Registradas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Total: <span className="font-semibold text-gray-900">{sales.length}</span> compras •{" "}
            <span className="font-semibold text-gray-900">{totalTickets}</span> entradas
          </p>
        </div>

        <BuyersSummary sales={sales} />

        {sales.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500">
            Aún no se han registrado compras.
          </div>
        ) : (
          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
                Detalle de ventas
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Comprador</th>
                    <th className="px-6 py-4 text-center">Entradas</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{sale.buyerName}</td>
                      <td className="px-6 py-4 text-center font-bold text-gray-900">
                        {sale.ticketCount}
                      </td>
                      <td className="px-6 py-4">
                        {sale.used ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Usado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Válido
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(sale.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
