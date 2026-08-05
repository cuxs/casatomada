"use client";

import { useCallback, useEffect, useState } from "react";
import { getSelectedEventId } from "@/lib/selected-event";

export interface EventItem {
  id: string;
  name: string;
  date: string;
  active: boolean;
  ended: boolean;
}

// Shared by the sidebar switcher and the Panel's "end event" card: resolves
// which event is currently selected (cookie, falling back to whichever is
// active) out of the full event list.
export function useCurrentEvent() {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudieron cargar los eventos");
        return;
      }

      const list = data as EventItem[];
      const stored = getSelectedEventId();
      // Prefers the active event; list[0] only kicks in once no event is
      // active at all (e.g. right after ending one, before creating the
      // next), so sales/nav "ended" state still resolves to something.
      const fallback = list.find((e) => e.active)?.id ?? list[0]?.id ?? null;

      setEvents(list);
      setSelectedId(
        stored && list.some((e) => e.id === stored) ? stored : fallback,
      );
    } catch {
      setError("No se pudo conectar con el servidor");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const currentEvent = events?.find((e) => e.id === selectedId) ?? null;

  return { events, selectedId, currentEvent, error, reload: load };
}
