import { act, renderHook, waitFor } from "@testing-library/react";
import { useCurrentEvent } from "../app/admin/_components/use-current-event";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function clearSelectedEventCookie() {
  document.cookie =
    "selectedEventId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function setSelectedEventCookie(id: string) {
  document.cookie = `selectedEventId=${id}; path=/;`;
}

// Flushes pending microtasks (promise rejections, .then chains) so state
// updates from a settled fetch have had a chance to apply.
async function flushMicrotasks() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("useCurrentEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSelectedEventCookie();
  });

  it("starts with events, selectedId and currentEvent all null", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useCurrentEvent());

    expect(result.current.events).toBeNull();
    expect(result.current.selectedId).toBeNull();
    expect(result.current.currentEvent).toBeNull();
  });

  it("fix: surfaces an error instead of leaving the dropdown stuck loading forever when the fetch call rejects", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(() => useCurrentEvent());

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith("/api/events"));
    await flushMicrotasks();

    expect(result.current.events).toBeNull();
    expect(result.current.error).toBe("No se pudo conectar con el servidor");
  });

  it("fix: surfaces the server's error message when the response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "No autorizado" }),
    });
    const { result } = renderHook(() => useCurrentEvent());

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith("/api/events"));
    await flushMicrotasks();

    expect(result.current.events).toBeNull();
    expect(result.current.error).toBe("No autorizado");
  });

  it("fix: reload() clears the error and recovers once the retry succeeds", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const { result } = renderHook(() => useCurrentEvent());

    await waitFor(() => expect(result.current.error).not.toBeNull());

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: "1",
            name: "Uno",
            date: "2026-06-01",
            active: true,
            ended: false,
          },
        ]),
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.events).not.toBeNull();
    expect(result.current.selectedId).toBe("1");
  });

  it("selects the active event when one is marked active", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: "1",
            name: "Viejo",
            date: "2026-01-01",
            active: false,
            ended: true,
          },
          {
            id: "2",
            name: "Activo",
            date: "2026-06-01",
            active: true,
            ended: false,
          },
        ]),
    });

    const { result } = renderHook(() => useCurrentEvent());

    await waitFor(() => expect(result.current.events).not.toBeNull());

    expect(result.current.selectedId).toBe("2");
    expect(result.current.currentEvent?.name).toBe("Activo");
  });

  it("falls back to the first event in the list when none is active (e.g. the last one just ended)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: "1",
            name: "Primero (no activo)",
            date: "2026-06-01",
            active: false,
            ended: false,
          },
          {
            id: "2",
            name: "Segundo (no activo)",
            date: "2026-01-01",
            active: false,
            ended: false,
          },
        ]),
    });

    const { result } = renderHook(() => useCurrentEvent());

    await waitFor(() => expect(result.current.events).not.toBeNull());

    // Deliberate fallback: with no active event (e.g. right after ending
    // one, before creating the next), pick list[0] so "ended" state still
    // resolves for the nav/stats UI rather than going blank.
    expect(result.current.selectedId).toBe("1");
    expect(result.current.currentEvent?.name).toBe("Primero (no activo)");
  });

  it("uses the id stored in the cookie when it matches an event in the list", async () => {
    setSelectedEventCookie("2");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: "1",
            name: "Uno",
            date: "2026-06-01",
            active: true,
            ended: false,
          },
          {
            id: "2",
            name: "Dos",
            date: "2026-01-01",
            active: false,
            ended: false,
          },
        ]),
    });

    const { result } = renderHook(() => useCurrentEvent());

    await waitFor(() => expect(result.current.events).not.toBeNull());

    expect(result.current.selectedId).toBe("2");
  });

  it("ignores a stored cookie id that no longer matches any event, falling back to the active one", async () => {
    setSelectedEventCookie("stale-id");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: "1",
            name: "Uno",
            date: "2026-06-01",
            active: true,
            ended: false,
          },
        ]),
    });

    const { result } = renderHook(() => useCurrentEvent());

    await waitFor(() => expect(result.current.events).not.toBeNull());

    expect(result.current.selectedId).toBe("1");
  });
});
