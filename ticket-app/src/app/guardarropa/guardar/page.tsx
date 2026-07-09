"use client";

import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import CodeWordCombobox, {
  type CodeWordResult,
} from "../_components/code-word-combobox";

const MAX_ITEM_COUNT = 99;

interface SavedCheck {
  itemCount: number;
  description: string;
  codeWord: string;
}

export default function GuardarPage() {
  const [selected, setSelected] = useState<CodeWordResult | null>(null);
  const [itemCount, setItemCount] = useState(1);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedCheck | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/guardarropa/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: selected.saleId,
          itemCount,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Ocurrió un error. Intentá de nuevo.");
        return;
      }

      setSaved({
        itemCount: data.itemCount,
        description: data.description,
        codeWord: data.sale.codeWord,
      });
    } catch {
      setError("No se pudo conectar con el servidor. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSelected(null);
    setItemCount(1);
    setDescription("");
    setError(null);
    setSaved(null);
  }

  if (saved) {
    return (
      <div className="space-y-6">
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
          <h1 className="text-2xl font-bold text-gray-900">¡Guardado!</h1>
          <p className="mt-1 text-gray-500 text-sm">
            Recordale a la persona su animal para retirar
          </p>
        </div>

        <div className="w-full text-center bg-gray-900 rounded-xl px-4 py-5">
          <p className="text-xs text-gray-300 uppercase tracking-wider">
            El código para retirar es
          </p>
          <p className="mt-1 text-2xl font-bold text-white capitalize">
            {saved.codeWord}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-1">
          <p className="text-gray-900 font-medium">
            {saved.itemCount}{" "}
            {saved.itemCount === 1 ? "objeto guardado" : "objetos guardados"}
          </p>
          {saved.description && (
            <p className="text-sm text-gray-500">{saved.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="w-full px-4 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Guardar otro
          </button>
          <Link
            href="/guardarropa"
            className="block w-full text-center px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Guardar</h1>
        <p className="mt-1 text-gray-500 text-sm">
          Buscá el animal del ticket y anotá qué deja
        </p>
      </div>

      {!selected ? (
        <CodeWordCombobox onSelect={setSelected} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-lg capitalize">
                {selected.codeWord}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {selected.buyerName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="shrink-0 text-sm font-medium text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
            >
              Cambiar
            </button>
          </div>

          {selected.activeDeposits > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg">
              Este ticket ya tiene {selected.activeDeposits}{" "}
              {selected.activeDeposits === 1
                ? "depósito activo"
                : "depósitos activos"}
              . ¿Guardar otro más?
            </div>
          )}

          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-gray-700">
              Cantidad de objetos
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setItemCount((count) => Math.max(1, count - 1))}
                disabled={itemCount <= 1}
                aria-label="Restar un objeto"
                className="w-14 h-14 flex items-center justify-center border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="flex-1 text-center text-3xl font-bold text-gray-900 tabular-nums">
                {itemCount}
              </span>
              <button
                type="button"
                onClick={() =>
                  setItemCount((count) => Math.min(MAX_ITEM_COUNT, count + 1))
                }
                disabled={itemCount >= MAX_ITEM_COUNT}
                aria-label="Sumar un objeto"
                className="w-14 h-14 flex items-center justify-center border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Descripción
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ej: campera negra y mochila roja"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-4 bg-gray-900 text-white font-medium text-lg rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando…
              </span>
            ) : (
              "Guardar"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
