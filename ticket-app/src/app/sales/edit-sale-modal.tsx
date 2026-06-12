"use client";

import { useState } from "react";
import type { Sale } from "@/lib/sales-summary";
import Modal from "./modal";

interface EditSaleModalProps {
  sale: Sale;
  onClose: () => void;
  onSaved: (sale: Sale) => void;
}

export default function EditSaleModal({ sale, onClose, onSaved }: EditSaleModalProps) {
  const [buyerName, setBuyerName] = useState(sale.buyerName);
  const [ticketCount, setTicketCount] = useState(sale.ticketCount);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/sales/${sale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerName, ticketCount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Ocurrió un error. Intentá de nuevo.");
        return;
      }

      onSaved(data as Sale);
    } catch {
      setError("No se pudo conectar con el servidor. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Editar compra" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="edit-buyerName" className="block text-sm font-medium text-gray-700">
            Nombre
          </label>
          <input
            id="edit-buyerName"
            type="text"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-ticketCount" className="block text-sm font-medium text-gray-700">
            Entradas
          </label>
          <input
            id="edit-ticketCount"
            type="number"
            min={1}
            step={1}
            value={ticketCount}
            onChange={(e) => setTicketCount(Math.max(1, Math.floor(Number(e.target.value))))}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !buyerName.trim()}
            className="flex-1 px-4 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </span>
            ) : (
              "Guardar"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
