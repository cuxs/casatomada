import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EventSwitcher from "../app/admin/_components/event-switcher";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function clearSelectedEventCookie() {
  document.cookie =
    "selectedEventId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

describe("EventSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSelectedEventCookie();
  });

  it("shows the 'Seleccionar evento' placeholder while events are still loading", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<EventSwitcher />);

    expect(screen.getByRole("combobox")).toHaveTextContent(
      "Seleccionar evento",
    );
  });

  it("fix: shows an error with a retry button instead of spinning forever when the events fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    render(<EventSwitcher />);

    fireEvent.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(
        screen.getByText("No se pudo conectar con el servidor"),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText("Cargando…")).not.toBeInTheDocument();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: "1",
            name: "Casa Tomada Aniversario",
            date: "2026-07-10",
            active: true,
            ended: false,
          },
        ]),
    });

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: /Casa Tomada Aniversario/ }),
      ).toBeInTheDocument();
    });
  });

  it("shows the loaded event's name once the fetch succeeds", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: "1",
            name: "Casa Tomada Aniversario",
            date: "2026-07-10",
            active: true,
            ended: false,
          },
        ]),
    });

    render(<EventSwitcher />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toHaveTextContent(
        "Casa Tomada Aniversario",
      );
    });
  });
});
