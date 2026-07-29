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

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (!res.ok) return;

      const list = data as EventItem[];
      const stored = getSelectedEventId();
      const fallback = list.find((e) => e.active)?.id ?? list[0]?.id ?? null;

      setEvents(list);
      setSelectedId(
        stored && list.some((e) => e.id === stored) ? stored : fallback,
      );
    } catch {
      // Stays unavailable; callers should handle the null/loading state.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const currentEvent = events?.find((e) => e.id === selectedId) ?? null;

  return { events, selectedId, currentEvent, reload: load };
}
