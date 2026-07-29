"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentEvent } from "./use-current-event";

export default function EndEventCard() {
  const { currentEvent } = useCurrentEvent();
  const [open, setOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentEvent) return null;

  async function handleEnd() {
    if (!currentEvent) return;
    setEnding(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${currentEvent.id}/end`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Ocurrió un error. Intentá de nuevo.");
        setEnding(false);
        return;
      }

      setOpen(false);
      // Full reload (not just this card's local state) so the sidebar's
      // "Registrar compra" item picks up the now-ended event too.
      window.location.reload();
    } catch {
      setError("No se pudo conectar con el servidor. Intentá de nuevo.");
      setEnding(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {currentEvent.name}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {currentEvent.ended
            ? "Evento finalizado — sus entradas quedaron vencidas."
            : "Evento en curso"}
        </p>
      </div>

      {currentEvent.ended ? (
        <span className="shrink-0 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Finalizado
        </span>
      ) : (
        <Button
          variant="outline"
          className="shrink-0 text-red-700 border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={() => setOpen(true)}
        >
          Finalizar evento
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              ¿Finalizar &quot;{currentEvent.name}&quot;?
            </DialogTitle>
            <DialogDescription>
              Todas las entradas de este evento quedarán marcadas como vencidas
              y no se van a poder registrar más ventas para él. Esta acción no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={ending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEnd}
              disabled={ending}
              className="bg-red-700 hover:bg-red-600"
            >
              {ending ? "Finalizando…" : "Finalizar evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
