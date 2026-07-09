"use client";

import Link from "next/link";
import { useReducer, useState } from "react";
import BuyersSummary from "./buyers-summary";

interface Ticket {
  qrDataUrl: string;
  codeWord: string;
  qrToken: string;
}

interface SaleResult {
  ticketCount: number;
  tickets: Ticket[];
}

const PRICES = [0, 10000, 13000, 15000];

function getCurrentPrice(): number {
  const now = new Date();
  if (now < new Date("2026-06-24T03:00:00Z")) return 10000;
  if (now < new Date("2026-07-02T03:00:00Z")) return 13000;
  return 15000;
}

interface PageState {
  buyerName: string;
  price: number;
  ticketCount: number;
  distinctQrs: boolean;
  loading: boolean;
  error: string | null;
  result: SaleResult | null;
}

type PageAction =
  | { type: "setBuyerName"; value: string }
  | { type: "setPrice"; value: number }
  | { type: "setTicketCount"; value: number }
  | { type: "setDistinctQrs"; value: boolean }
  | { type: "submitStart" }
  | { type: "submitSuccess"; result: SaleResult }
  | { type: "submitFailure"; error: string }
  | { type: "reset" };

function createInitialPageState(): PageState {
  return {
    buyerName: "",
    price: getCurrentPrice(),
    ticketCount: 1,
    distinctQrs: false,
    loading: false,
    error: null,
    result: null,
  };
}

function pageReducer(state: PageState, action: PageAction): PageState {
  switch (action.type) {
    case "setBuyerName":
      return { ...state, buyerName: action.value };
    case "setPrice":
      return { ...state, price: action.value };
    case "setTicketCount":
      return {
        ...state,
        ticketCount: action.value,
        distinctQrs: action.value <= 1 ? false : state.distinctQrs,
      };
    case "setDistinctQrs":
      return { ...state, distinctQrs: action.value };
    case "submitStart":
      return { ...state, loading: true, error: null };
    case "submitSuccess":
      return { ...state, loading: false, error: null, result: action.result };
    case "submitFailure":
      return { ...state, loading: false, error: action.error };
    case "reset":
      return createInitialPageState();
  }
}

export default function RegisterSalePage() {
  const [state, dispatch] = useReducer(
    pageReducer,
    undefined,
    createInitialPageState,
  );
  const [buyersRefreshKey, setBuyersRefreshKey] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: "submitStart" });

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: state.buyerName,
          price: state.price,
          ticketCount: state.ticketCount,
          distinctQrs: state.distinctQrs,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        dispatch({
          type: "submitFailure",
          error: data.error ?? "Ocurrió un error. Intentá de nuevo.",
        });
        return;
      }

      const tickets: Ticket[] = data.tickets ?? [
        {
          qrDataUrl: data.qrDataUrl,
          codeWord: data.codeWord,
          qrToken: data.qrToken,
        },
      ];

      dispatch({
        type: "submitSuccess",
        result: { ticketCount: data.ticketCount, tickets },
      });
      setBuyersRefreshKey((key) => key + 1);
    } catch {
      dispatch({
        type: "submitFailure",
        error: "No se pudo conectar con el servidor. Intentá de nuevo.",
      });
    }
  }

  function handleNewSale() {
    dispatch({ type: "reset" });
  }

  if (state.result) {
    const result = state.result;
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
            {result.tickets.length > 1
              ? "Guardá estos QRs — se los van a pedir en la entrada"
              : "Guardá este QR — te lo van a pedir en la entrada"}
          </p>
        </div>

        {result.tickets.map((ticket, index) => (
          <div
            key={ticket.qrToken}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col items-center gap-4"
          >
            {result.tickets.length > 1 && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Entrada {index + 1} de {result.tickets.length}
              </p>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ticket.qrDataUrl}
              alt="QR de entrada"
              className="w-56 h-56"
            />
            <p className="text-sm font-medium text-gray-700 bg-gray-100 px-4 py-2 rounded-full">
              Válido para{" "}
              <span className="font-bold">
                {result.tickets.length > 1 ? 1 : result.ticketCount}{" "}
                {(result.tickets.length > 1 ? 1 : result.ticketCount) === 1
                  ? "entrada"
                  : "entradas"}
              </span>
            </p>
            <div className="w-full text-center bg-gray-900 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-300 uppercase tracking-wider">
                Tu animal
              </p>
              <p className="mt-1 text-lg font-bold text-white capitalize">
                {ticket.codeWord}
              </p>
            </div>
            <div className="w-full text-center bg-gray-900 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-300 uppercase tracking-wider">
                Tu código
              </p>
              <p className="mt-1 text-lg font-bold text-white tracking-widest">
                {ticket.qrToken.slice(-3).toUpperCase()}
              </p>
            </div>
          </div>
        ))}

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
            value={state.buyerName}
            onChange={(e) =>
              dispatch({ type: "setBuyerName", value: e.target.value })
            }
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
            value={state.price}
            onChange={(e) =>
              dispatch({ type: "setPrice", value: Number(e.target.value) })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
          >
            {PRICES.map((p) => (
              <option key={p} value={p}>
                {p === 0 ? "Gratis" : `$${p.toLocaleString("es-AR")}`}
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
            value={state.ticketCount}
            onChange={(e) => {
              const next = Math.max(1, Math.floor(Number(e.target.value)));
              dispatch({ type: "setTicketCount", value: next });
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
          />
        </div>

        <label
          htmlFor="distinctQrs"
          className={`flex items-start gap-2.5 ${
            state.ticketCount > 1
              ? "cursor-pointer"
              : "cursor-not-allowed opacity-50"
          }`}
        >
          <input
            id="distinctQrs"
            type="checkbox"
            checked={state.distinctQrs}
            disabled={state.ticketCount <= 1}
            onChange={(e) =>
              dispatch({ type: "setDistinctQrs", value: e.target.checked })
            }
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 disabled:cursor-not-allowed"
          />
          <span className="text-sm text-gray-700">
            Generar QRs distintos
            <span className="block text-xs text-gray-500">
              Genera {state.ticketCount} QRs, cada uno válido para 1 sola
              persona, en vez de un único QR para las {state.ticketCount}{" "}
              entradas.
            </span>
          </span>
        </label>

        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={state.loading || !state.buyerName.trim()}
          className="w-full px-4 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {state.loading ? (
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
