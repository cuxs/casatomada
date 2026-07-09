"use client";

import { ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface CodeWordResult {
  saleId: string;
  codeWord: string;
  buyerName: string;
  activeDeposits: number;
}

interface CodeWordComboboxProps {
  onSelect: (result: CodeWordResult) => void;
}

export default function CodeWordCombobox({ onSelect }: CodeWordComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CodeWordResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setError(null);
      setSearched(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/guardarropa/search?query=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Ocurrió un error. Intentá de nuevo.");
          setResults([]);
        } else {
          setError(null);
          setResults(data.results);
        }
        setSearched(true);
        setLoading(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("No se pudo conectar con el servidor. Intentá de nuevo.");
        setResults([]);
        setSearched(true);
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setQuery("");
  }

  function handleSelect(result: CodeWordResult) {
    setOpen(false);
    setQuery("");
    onSelect(result);
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-gray-700">
        Animal del ticket
      </span>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full h-14 justify-between px-4 text-base font-normal text-gray-500 bg-white"
          >
            Buscar animal… (ej: capibara)
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          {/* Search runs server-side against the sales' code words, so
              cmdk's own filtering must stay off. */}
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="ej: capibara"
              autoFocus
              className="text-base"
            />
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
                  <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Buscando…
                </div>
              )}

              {error && !loading && (
                <p className="py-6 px-4 text-center text-sm text-red-700">
                  {error}
                </p>
              )}

              {!loading && !error && !searched && (
                <p className="py-6 px-4 text-center text-sm text-gray-500">
                  Escribí el animal del ticket
                </p>
              )}

              {!loading && !error && searched && results.length === 0 && (
                <p className="py-6 px-4 text-center text-sm text-gray-500">
                  No se encontró ningún ticket con ese animal.
                </p>
              )}

              {!loading && results.length > 0 && (
                <CommandGroup>
                  {results.map((result) => (
                    <CommandItem
                      key={result.saleId}
                      value={result.saleId}
                      onSelect={() => handleSelect(result)}
                      className="justify-between gap-3 px-3 py-3 cursor-pointer"
                    >
                      <span className="min-w-0">
                        <span className="block font-bold capitalize">
                          {result.codeWord}
                        </span>
                        <span className="block text-sm text-gray-500 truncate">
                          {result.buyerName}
                        </span>
                      </span>
                      {result.activeDeposits > 0 && (
                        <span className="shrink-0 text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                          {result.activeDeposits} en guardarropa
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
