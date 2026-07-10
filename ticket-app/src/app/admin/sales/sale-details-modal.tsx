"use client";

import type { Sale } from "@/lib/sales-summary";
import Modal from "./modal";

interface SaleDetailsModalProps {
  sale: Sale;
  onClose: () => void;
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SaleDetailsModal({
  sale,
  onClose,
}: SaleDetailsModalProps) {
  return (
    <Modal title="Detalle de la compra" onClose={onClose}>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Comprador</dt>
          <dd className="font-medium text-gray-900 text-right">
            {sale.buyerName}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Palabra clave</dt>
          <dd className="font-medium text-gray-900 capitalize text-right">
            {sale.codeWord}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Entradas</dt>
          <dd className="font-bold text-gray-900">{sale.ticketCount}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Token</dt>
          <dd className="font-mono text-xs text-gray-900 text-right break-all">
            {sale.qrToken}
          </dd>
        </div>
        {typeof sale.price === "number" && (
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Precio</dt>
            <dd className="font-medium text-gray-900">
              ${sale.price.toLocaleString("es-AR")}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Estado</dt>
          <dd>
            {sale.used ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Usado
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Válido
              </span>
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Compra</dt>
          <dd className="text-gray-700 text-right">
            {formatDateTime(sale.createdAt)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Canjeado</dt>
          <dd className="text-gray-700 text-right">
            {sale.usedAt ? formatDateTime(sale.usedAt) : "—"}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onClose}
        className="w-full px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
      >
        Cerrar
      </button>
    </Modal>
  );
}
