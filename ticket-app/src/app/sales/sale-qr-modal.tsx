"use client";

import { useEffect, useState } from "react";
import type { Sale } from "@/lib/sales-summary";
import Modal from "./modal";

interface SaleQrModalProps {
  sale: Sale;
  onClose: () => void;
}

interface QrData {
  qrDataUrl: string;
  codeWord: string;
  qrToken: string;
  ticketCount: number;
}

export default function SaleQrModal({ sale, onClose }: SaleQrModalProps) {
  const [data, setData] = useState<QrData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadQr() {
      try {
        const res = await fetch(`/api/sales/${sale.id}/qr`);
        const json = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(json.error ?? "Ocurrió un error al generar el QR.");
          return;
        }
        if (!cancelled) setData(json as QrData);
      } catch {
        if (!cancelled) setError("No se pudo conectar con el servidor. Intentá de nuevo.");
      }
    }

    loadQr();
    return () => {
      cancelled = true;
    };
  }, [sale.id]);

  async function handleShare() {
    if (!data) return;
    setSharing(true);

    try {
      const res = await fetch(data.qrDataUrl);
      const blob = await res.blob();
      const file = new File([blob], `entrada-${sale.codeWord}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Tu entrada",
          text: `Entrada para ${sale.buyerName}`,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: "Tu entrada",
          text: `Entrada para ${sale.buyerName}: animal ${data.codeWord}, código ${data.qrToken
            .slice(-3)
            .toUpperCase()}`,
        });
      }
    } catch {
      // El usuario canceló el diálogo de compartir.
    } finally {
      setSharing(false);
    }
  }

  return (
    <Modal title="QR de la entrada" onClose={onClose}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="flex justify-center py-12">
          <span className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      )}

      {data && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-gray-500 text-center">
            Entrada de <span className="font-medium text-gray-900">{sale.buyerName}</span>
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.qrDataUrl} alt="QR de entrada" className="w-56 h-56" />
          <p className="text-sm font-medium text-gray-700 bg-gray-100 px-4 py-2 rounded-full">
            Válido para{" "}
            <span className="font-bold">
              {data.ticketCount} {data.ticketCount === 1 ? "entrada" : "entradas"}
            </span>
          </p>
          <div className="w-full text-center bg-gray-900 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-300 uppercase tracking-wider">Animal</p>
            <p className="mt-1 text-lg font-bold text-white capitalize">{data.codeWord}</p>
          </div>
          <div className="w-full text-center bg-gray-900 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-300 uppercase tracking-wider">Código</p>
            <p className="mt-1 text-lg font-bold text-white tracking-widest">
              {data.qrToken.slice(-3).toUpperCase()}
            </p>
          </div>

          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              type="button"
              onClick={handleShare}
              disabled={sharing}
              className="w-full px-4 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {sharing ? "Compartiendo..." : "Compartir"}
            </button>
          )}
        </div>
      )}

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
