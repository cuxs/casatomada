"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import TicketCodeCombobox, {
  type TicketCodeResult,
} from "../_components/ticket-code-combobox";

interface GuardarropaCheck {
  id: string;
  itemCount: number;
  description: string;
  createdAt: string;
  retrievedAt?: string | null;
}

export default function RetirarPage() {
  const [selected, setSelected] = useState<TicketCodeResult | null>(null);
  const [checks, setChecks] = useState<GuardarropaCheck[] | null>(null);
  const [retrievedChecks, setRetrievedChecks] = useState<GuardarropaCheck[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [retrievingId, setRetrievingId] = useState<string | null>(null);
  const [retrievedCount, setRetrievedCount] = useState(0);
  const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    };
  }, []);

  async function loadChecks(saleId: string) {
    setLoading(true);
    setError(null);
    setChecks(null);
    setRetrievedChecks([]);

    try {
      const res = await fetch(
        `/api/guardarropa/checks?saleId=${encodeURIComponent(saleId)}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Ocurrió un error. Intentá de nuevo.");
        return;
      }

      setChecks(data.checks);
      setRetrievedChecks(data.retrievedChecks ?? []);
    } catch {
      setError("No se pudo conectar con el servidor. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(result: TicketCodeResult) {
    setSelected(result);
    setRetrievedCount(0);
    loadChecks(result.saleId);
  }

  function handleReset() {
    if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    setSelected(null);
    setChecks(null);
    setRetrievedChecks([]);
    setError(null);
    setConfirmingId(null);
    setRetrievingId(null);
    setRetrievedCount(0);
  }

  function handleRetrieveTap(check: GuardarropaCheck) {
    if (confirmingId !== check.id) {
      // First tap only arms the button; it disarms after 3s so a stray
      // tap doesn't hand over someone else's clothes.
      setConfirmingId(check.id);
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
      confirmTimeout.current = setTimeout(() => setConfirmingId(null), 3000);
      return;
    }

    if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    setConfirmingId(null);
    retrieve(check);
  }

  async function retrieve(check: GuardarropaCheck) {
    if (!selected) return;
    setRetrievingId(check.id);
    setError(null);

    try {
      const res = await fetch(`/api/guardarropa/checks/${check.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retrieve" }),
      });

      if (res.ok) {
        setChecks(
          (current) => current?.filter((c) => c.id !== check.id) ?? null,
        );
        setRetrievedChecks((current) => [
          { ...check, retrievedAt: new Date().toISOString() },
          ...current,
        ]);
        setRetrievedCount((count) => count + 1);
        return;
      }

      const data = await res.json();
      setError(data.error ?? "Ocurrió un error. Intentá de nuevo.");
      if (res.status === 409 || res.status === 404) {
        loadChecks(selected.saleId);
      }
    } catch {
      setError("No se pudo conectar con el servidor. Intentá de nuevo.");
    } finally {
      setRetrievingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Retirar</h1>
        <p className="mt-1 text-gray-500 text-sm">
          Buscá el código del ticket para entregar sus prendas
        </p>
      </div>

      {!selected ? (
        <TicketCodeCombobox onSelect={handleSelect} />
      ) : (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-lg font-mono tracking-widest">
                {selected.code}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {selected.buyerName}
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="shrink-0 text-sm font-medium text-gray-500 hover:text-gray-900 underline underline-offset-2 transition-colors"
            >
              Cambiar
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {retrievedCount > 0 && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg">
              {retrievedCount === 1
                ? "Depósito entregado."
                : `${retrievedCount} depósitos entregados.`}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 px-1 py-2 text-sm text-gray-500">
              <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Buscando depósitos…
            </div>
          )}

          {!loading && checks && checks.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-center text-gray-500">
              Este ticket no tiene nada en el guardarropa.
            </div>
          )}

          {!loading &&
            checks?.map((check) => (
              <div
                key={check.id}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-3"
              >
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {check.itemCount}{" "}
                    {check.itemCount === 1 ? "objeto" : "objetos"}
                  </p>
                  {check.description && (
                    <p className="mt-0.5 text-sm text-gray-600">
                      {check.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Guardado a las{" "}
                    {new Date(check.createdAt).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRetrieveTap(check)}
                  disabled={retrievingId === check.id}
                  className={`w-full px-4 py-3.5 font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                    confirmingId === check.id
                      ? "bg-red-600 text-white hover:bg-red-500"
                      : "bg-gray-900 text-white hover:bg-gray-700"
                  }`}
                >
                  {retrievingId === check.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Entregando…
                    </span>
                  ) : confirmingId === check.id ? (
                    "Confirmar retiro"
                  ) : (
                    "Marcar como retirado"
                  )}
                </button>
              </div>
            ))}

          {!loading && retrievedChecks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Ya retirado</p>
              {retrievedChecks.map((check) => (
                <div
                  key={check.id}
                  className="bg-gray-50 border border-gray-200 rounded-2xl p-4"
                >
                  <p className="font-semibold text-gray-700">
                    {check.itemCount}{" "}
                    {check.itemCount === 1 ? "objeto" : "objetos"}
                  </p>
                  {check.description && (
                    <p className="mt-0.5 text-sm text-gray-500">
                      {check.description}
                    </p>
                  )}
                  {check.retrievedAt && (
                    <p className="mt-1 text-xs text-gray-400">
                      Retirado el{" "}
                      {new Date(check.retrievedAt).toLocaleDateString("es-AR")}{" "}
                      a las{" "}
                      {new Date(check.retrievedAt).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <Link
            href="/guardarropa"
            className="block w-full text-center px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      )}
    </div>
  );
}
