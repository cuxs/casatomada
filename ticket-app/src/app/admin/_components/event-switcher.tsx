"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { setSelectedEventId } from "@/lib/selected-event";
import { useCurrentEvent } from "./use-current-event";

export default function EventSwitcher() {
  const [open, setOpen] = useState(false);
  const { events, selectedId, currentEvent } = useCurrentEvent();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function handleSelect(id: string) {
    setOpen(false);
    setSelectedEventId(id);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), date: newDate }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error ?? "Ocurrió un error. Intentá de nuevo.");
        setCreating(false);
        return;
      }

      setSelectedEventId(data.id);
    } catch {
      setCreateError("No se pudo conectar con el servidor. Intentá de nuevo.");
      setCreating(false);
    }
  }

  return (
    <div className="mb-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between px-3 text-sm font-medium text-gray-900 bg-white"
          >
            <span className="truncate">
              {currentEvent?.name ?? "Seleccionar evento"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandList>
              {!events && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
                  <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Cargando…
                </div>
              )}

              {events && events.length === 0 && (
                <CommandEmpty>No hay eventos todavía.</CommandEmpty>
              )}

              {events && events.length > 0 && (
                <CommandGroup>
                  {events.map((event) => (
                    <CommandItem
                      key={event.id}
                      value={event.id}
                      onSelect={() => handleSelect(event.id)}
                      className="justify-between gap-3 px-3 py-2.5 cursor-pointer"
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="font-medium truncate">
                            {event.name}
                          </span>
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
                      {event.id === selectedId && (
                        <Check className="h-4 w-4 shrink-0" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setCreateOpen(true);
                  }}
                  className="gap-3 px-3 py-2.5 cursor-pointer text-gray-700"
                >
                  <Plus className="h-4 w-4" />
                  Crear evento
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Crear evento</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="event-name"
                className="block text-sm font-medium text-gray-700"
              >
                Nombre
              </label>
              <input
                id="event-name"
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Casa Tomada Diciembre"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="event-date"
                className="block text-sm font-medium text-gray-700"
              >
                Fecha
              </label>
              <input
                id="event-date"
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
              />
            </div>

            {createError && (
              <p className="text-sm text-red-600">{createError}</p>
            )}

            <DialogFooter>
              <Button
                type="submit"
                disabled={creating || !newName.trim() || !newDate}
              >
                {creating ? "Creando…" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
