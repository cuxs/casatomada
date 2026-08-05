"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { setSelectedEventId } from "@/lib/selected-event";
import type { EventItem } from "./use-current-event";

interface EventPickerProps {
  events: EventItem[];
}

export default function EventPicker({ events }: EventPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    events.find((e) => e.active)?.id ?? events[0]?.id ?? null,
  );

  if (events.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          No hay eventos todavía
        </h1>
        <p className="text-gray-500 text-sm">
          Creá uno desde el selector de eventos en la barra lateral para
          empezar.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Elegí un evento</h1>
        <p className="text-gray-500 text-sm mt-1">
          Vas a administrar este evento hasta que elijas otro.
        </p>
      </div>

      <div className="space-y-2 mb-6" role="radiogroup" aria-label="Eventos">
        {events.map((event) => (
          <label
            key={event.id}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left cursor-pointer transition-colors ${
              event.id === selectedId
                ? "border-gray-900 bg-gray-900/5"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="event"
              value={event.id}
              checked={event.id === selectedId}
              onChange={() => setSelectedId(event.id)}
              className="sr-only"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="font-medium text-gray-900 truncate">
                  {event.name}
                </span>
                {event.active && (
                  <span className="shrink-0 text-[10px] font-semibold text-green-600 uppercase tracking-wider">
                    Activo
                  </span>
                )}
                {event.ended && (
                  <span className="shrink-0 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Finalizado
                  </span>
                )}
              </span>
              <span className="block text-xs text-gray-500">
                {new Date(event.date).toLocaleDateString("es-AR")}
              </span>
            </span>
          </label>
        ))}
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={!selectedId}
        onClick={() => selectedId && setSelectedEventId(selectedId)}
      >
        Siguiente
      </Button>
    </div>
  );
}
