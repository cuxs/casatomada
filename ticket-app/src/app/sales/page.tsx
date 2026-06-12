"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import SaleDetailsModal from "./sale-details-modal";
import EditSaleModal from "./edit-sale-modal";
import {
  aggregateBuyers,
  downloadBuyersCSV,
  downloadBuyersTXT,
  type BuyerSummary,
  type Sale,
} from "@/lib/sales-summary";

const PAGE_SIZE = 10;

interface SalesResponse {
  sales: Sale[];
  total: number;
  totalTickets: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [buyers, setBuyers] = useState<BuyerSummary[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [editSale, setEditSale] = useState<Sale | null>(null);
  const [buyersRefreshKey, setBuyersRefreshKey] = useState(0);

  const hasLoadedRef = useRef(false);

  const loadSales = useCallback(async (targetPage: number, searchTerm: string) => {
    if (!hasLoadedRef.current) {
      setLoading(true);
    } else {
      setTableLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(PAGE_SIZE),
      });
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/api/sales?${params.toString()}`, { method: "GET" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Ocurrió un error al cargar las ventas.");
        setSales(null);
        return;
      }

      const result = data as SalesResponse;
      setSales(result.sales);
      setTotalPages(result.totalPages);
      setPage(result.page);
    } catch {
      setError("No se pudo conectar con el servidor. Intentá de nuevo.");
      setSales(null);
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
      setTableLoading(false);
    }
  }, []);

  const isFirstSearchRun = useRef(true);
  useEffect(() => {
    if (isFirstSearchRun.current) {
      isFirstSearchRun.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadSales(page, debouncedSearch);
  }, [page, debouncedSearch, loadSales]);

  const loadBuyers = useCallback(async () => {
    try {
      const res = await fetch("/api/sales", { method: "GET" });
      const data = await res.json();
      if (res.ok) {
        setBuyers(aggregateBuyers(data as Sale[]));
      }
    } catch {
      // Totals and downloads stay unavailable; the main table still works.
    }
  }, []);

  useEffect(() => {
    loadBuyers();
  }, [loadBuyers, buyersRefreshKey]);

  function handleSaleSaved() {
    setEditSale(null);
    setBuyersRefreshKey((k) => k + 1);
    loadSales(page, debouncedSearch);
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
            onClick={() => loadSales(page, debouncedSearch)}
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

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl lg:max-w-4xl space-y-6">
        <div>
          <Link
            href="/register-sale"
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← Registrar compra
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Ventas Registradas</h1>
        </div>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 lg:px-4 lg:py-2.5 border-b border-gray-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
                  Detalle de ventas
                </h2>
                {buyers && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {buyers.length} {buyers.length === 1 ? "persona" : "personas"} •{" "}
                    {buyers.reduce((acc, b) => acc + b.ticketCount, 0)} entradas
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

            <div className="relative lg:max-w-xs lg:ml-auto">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre..."
                aria-label="Buscar por nombre"
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
              />
              {tableLoading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="block w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
                </span>
              )}
            </div>
          </div>

          {sales.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              {debouncedSearch
                ? `No se encontraron compras para "${debouncedSearch}".`
                : "Aún no se han registrado compras."}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4 lg:px-4 lg:py-2.5">Nombre</th>
                      <th className="px-6 py-4 lg:px-4 lg:py-2.5 text-center">Entradas</th>
                      <th className="px-6 py-4 lg:px-4 lg:py-2.5 w-12">
                        <span className="sr-only">Ver detalle</span>
                      </th>
                      <th className="px-6 py-4 lg:px-4 lg:py-2.5 w-12">
                        <span className="sr-only">Editar</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 lg:px-4 lg:py-2.5 font-medium text-gray-900">{sale.buyerName}</td>
                        <td className="px-6 py-4 lg:px-4 lg:py-2.5 text-center font-bold text-gray-900">
                          {sale.ticketCount}
                        </td>
                        <td className="px-6 py-4 lg:px-4 lg:py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => setViewSale(sale)}
                            aria-label={`Ver detalle de ${sale.buyerName}`}
                            className="text-gray-400 hover:text-gray-900 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-6 py-4 lg:px-4 lg:py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => setEditSale(sale)}
                            aria-label={`Editar a ${sale.buyerName}`}
                            className="text-gray-400 hover:text-gray-900 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 lg:px-4 lg:py-2.5 border-t border-gray-100 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="text-gray-500">
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {viewSale && <SaleDetailsModal sale={viewSale} onClose={() => setViewSale(null)} />}
      {editSale && (
        <EditSaleModal sale={editSale} onClose={() => setEditSale(null)} onSaved={handleSaleSaved} />
      )}
    </main>
  );
}
