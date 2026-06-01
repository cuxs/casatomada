import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SalesPage from "../app/sales/page";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockClick = vi.fn();

describe("SalesPage", () => {
  const originalCreateElement = document.createElement;

  beforeAll(() => {
    document.createElement = function (tagName: string, options?: ElementCreationOptions) {
      const el = originalCreateElement.call(document, tagName, options);
      if (tagName === "a") {
        el.click = mockClick;
      }
      return el;
    };
  });

  afterAll(() => {
    document.createElement = originalCreateElement;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<SalesPage />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("handles load failure and allows retry", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "No autorizado" }),
    });

    render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByText("No autorizado")).toBeInTheDocument();
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => {
      expect(screen.getByText("Ventas Registradas")).toBeInTheDocument();
    });
  });

  it("displays sales, aggregated buyers table, and supports downloads", async () => {
    const mockSales = [
      { id: "1", buyerName: "Juan Pérez", ticketCount: 2, used: false, createdAt: "2026-05-29T10:00:00.000Z" },
      { id: "2", buyerName: "Ana Ruiz", ticketCount: 1, used: true, createdAt: "2026-05-29T11:00:00.000Z" },
      { id: "3", buyerName: "Juan Pérez", ticketCount: 1, used: false, createdAt: "2026-05-29T12:00:00.000Z" },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSales),
    });

    render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByText("Ventas Registradas")).toBeInTheDocument();
    });

    expect(screen.getByText("Ventas Registradas")).toBeInTheDocument();
    expect(document.body.textContent).toContain("3 compras");
    expect(document.body.textContent).toContain("4 entradas");
    expect(screen.getByText("Compradores")).toBeInTheDocument();
    expect(screen.getByText("Detalle de ventas")).toBeInTheDocument();
    expect(screen.getAllByText("Juan Pérez")).toHaveLength(3);
    expect(screen.getAllByText("Ana Ruiz")).toHaveLength(2);

    const csvBtn = screen.getByRole("button", { name: "Descargar CSV" });
    fireEvent.click(csvBtn);
    expect(mockClick).toHaveBeenCalled();

    const txtBtn = screen.getByRole("button", { name: "Descargar TXT" });
    fireEvent.click(txtBtn);
    expect(mockClick).toHaveBeenCalledTimes(2);
  });
});
