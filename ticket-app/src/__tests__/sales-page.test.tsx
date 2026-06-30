import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SalesPage from "../app/admin/sales/page";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockClick = vi.fn();

function tablePage(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    sales: [],
    total: 0,
    totalTickets: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    ...overrides,
  };
}

describe("SalesPage", () => {
  const originalCreateElement = document.createElement;

  beforeAll(() => {
    document.createElement = (
      tagName: string,
      options?: ElementCreationOptions,
    ) => {
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
      json: () => Promise.resolve(tablePage()),
    });

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => {
      expect(screen.getByText("Ventas registradas")).toBeInTheDocument();
    });
  });

  it("displays sales, aggregated buyers table, and supports downloads", async () => {
    const mockSales = [
      {
        id: "1",
        buyerName: "Juan Pérez",
        codeWord: "lombriz roja del monte",
        qrToken: "qr-token-001",
        price: 10000,
        ticketCount: 2,
        used: false,
        usedAt: null,
        createdAt: "2026-05-29T10:00:00.000Z",
      },
      {
        id: "2",
        buyerName: "Ana Ruiz",
        codeWord: "marmota azul de la esquina",
        qrToken: "qr-token-002",
        price: 10000,
        ticketCount: 1,
        used: true,
        usedAt: "2026-05-30T10:00:00.000Z",
        createdAt: "2026-05-29T11:00:00.000Z",
      },
      {
        id: "3",
        buyerName: "Juan Pérez",
        codeWord: "capibara verde de la terraza",
        qrToken: "qr-token-003",
        price: 10000,
        ticketCount: 1,
        used: false,
        usedAt: null,
        createdAt: "2026-05-29T12:00:00.000Z",
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            tablePage({ sales: mockSales, total: 3, totalTickets: 4 }),
          ),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSales),
      });

    render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByText("Ventas registradas")).toBeInTheDocument();
    });

    expect(screen.getByText("Detalle de ventas")).toBeInTheDocument();
    expect(screen.getAllByText("Juan Pérez")).toHaveLength(2);
    expect(screen.getAllByText("Ana Ruiz")).toHaveLength(1);

    await waitFor(() => {
      expect(document.body.textContent).toContain("2 personas");
    });
    expect(document.body.textContent).toContain("4 entradas");

    const csvBtn = screen.getByRole("button", { name: "Descargar CSV" });
    fireEvent.click(csvBtn);
    expect(mockClick).toHaveBeenCalled();

    const txtBtn = screen.getByRole("button", { name: "Descargar TXT" });
    fireEvent.click(txtBtn);
    expect(mockClick).toHaveBeenCalledTimes(2);
  });

  it("sends the search term to the backend after typing", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(tablePage()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(tablePage()),
      });

    render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByText("Ventas registradas")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Buscar por nombre"), {
      target: { value: "Ana" },
    });

    await waitFor(
      () => {
        const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
        expect(String(lastCall[0])).toContain("search=Ana");
      },
      { timeout: 2000 },
    );
  });

  it("paginates results", async () => {
    const mockSales = [
      {
        id: "1",
        buyerName: "Juan Pérez",
        codeWord: "lombriz roja del monte",
        qrToken: "qr-token-001",
        price: 10000,
        ticketCount: 2,
        used: false,
        usedAt: null,
        createdAt: "2026-05-29T10:00:00.000Z",
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            tablePage({
              sales: mockSales,
              total: 25,
              totalTickets: 30,
              totalPages: 3,
            }),
          ),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSales),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            tablePage({
              sales: mockSales,
              total: 25,
              totalTickets: 30,
              page: 2,
              totalPages: 3,
            }),
          ),
      });

    render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => {
      expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
    });

    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    expect(String(lastCall[0])).toContain("page=2");
  });

  it("opens the details modal when clicking the view icon", async () => {
    const mockSales = [
      {
        id: "1",
        buyerName: "Juan Pérez",
        codeWord: "lombriz roja del monte",
        qrToken: "qr-token-001",
        price: 10000,
        ticketCount: 2,
        used: false,
        usedAt: null,
        createdAt: "2026-05-29T10:00:00.000Z",
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            tablePage({ sales: mockSales, total: 1, totalTickets: 2 }),
          ),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSales),
      });

    render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByText("Ventas registradas")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Ver detalle de Juan Pérez" }),
    );

    expect(screen.getByText("Detalle de la compra")).toBeInTheDocument();
    expect(screen.getByText("lombriz roja del monte")).toBeInTheDocument();
    expect(screen.getByText("Válido")).toBeInTheDocument();
  });

  it("opens the QR modal and shows the regenerated QR for a sale", async () => {
    const mockSales = [
      {
        id: "1",
        buyerName: "Juan Pérez",
        codeWord: "lombriz roja del monte",
        qrToken: "qr-token-001",
        price: 10000,
        ticketCount: 2,
        used: false,
        usedAt: null,
        createdAt: "2026-05-29T10:00:00.000Z",
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            tablePage({ sales: mockSales, total: 1, totalTickets: 2 }),
          ),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSales),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            qrDataUrl: "data:image/png;base64,abc123",
            codeWord: "lombriz roja del monte",
            qrToken: "qr-token-001",
            ticketCount: 2,
          }),
      });

    render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByText("Ventas registradas")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Ver QR de Juan Pérez" }),
    );

    expect(screen.getByText("QR de la entrada")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByAltText("QR de entrada")).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenLastCalledWith("/api/sales/1/qr");
    expect(screen.getByText("lombriz roja del monte")).toBeInTheDocument();
    expect(screen.getByText("001")).toBeInTheDocument();
  });

  it("edits a sale via the edit modal", async () => {
    const sale = {
      id: "1",
      buyerName: "Juan Pérez",
      codeWord: "lombriz roja del monte",
      qrToken: "qr-token-001",
      price: 10000,
      ticketCount: 2,
      used: false,
      usedAt: null,
      createdAt: "2026-05-29T10:00:00.000Z",
    };
    const updatedSale = { ...sale, buyerName: "Pedro Gómez" };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            tablePage({ sales: [sale], total: 1, totalTickets: 2 }),
          ),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([sale]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedSale),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            tablePage({ sales: [updatedSale], total: 1, totalTickets: 2 }),
          ),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([updatedSale]),
      });

    render(<SalesPage />);

    await waitFor(() => {
      expect(screen.getByText("Ventas registradas")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Editar a Juan Pérez" }),
    );

    const nameInput = screen.getByLabelText("Nombre");
    expect(nameInput).toHaveValue("Juan Pérez");

    fireEvent.change(nameInput, { target: { value: "Pedro Gómez" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/sales/1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerName: "Pedro Gómez", ticketCount: 2 }),
      });
    });

    await waitFor(() => {
      expect(screen.queryByText("Editar compra")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByText("Pedro Gómez").length).toBeGreaterThan(0);
    });
  });
});
