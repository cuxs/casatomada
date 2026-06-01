import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomePageClient from "../app/HomePageClient";
import { getEventConfig } from "@/config";

const eventConfig = getEventConfig();

// Mock global.fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders basic info correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: "1",
        name: "Tanda 1 — Comunidad",
        price: 10000,
        total: 150,
        sold: 20,
        remaining: 130,
      }),
    });

    render(<HomePageClient eventConfig={eventConfig} />);

    // Header checks
    expect(screen.getByText("Conseguí tu entrada")).toBeInTheDocument();
    expect(screen.getByText("Realizá la transferencia y registrá tu compra")).toBeInTheDocument();

    // Payment card checks
    expect(screen.getByText("Datos de pago")).toBeInTheDocument();
    expect(screen.getByText("casatomada.mp")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir Mercado Pago" })).toHaveAttribute(
      "href",
      "https://link.mercadopago.com.ar/casatomada"
    );

    // Remaining tickets checks (wait for fetch to resolve)
    await waitFor(() => {
      expect(screen.getByText("Entradas disponibles — Tanda 1 — Comunidad")).toBeInTheDocument();
    });
    expect(screen.getByText("130")).toBeInTheDocument();
    expect(screen.getByText(/de 150/)).toBeInTheDocument();

    // Link to register sale should not be present
    expect(screen.queryByRole("link", { name: "Ya pagué →" })).not.toBeInTheDocument();
  });

  it("handles empty/no active batch state correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "No active batch found" }),
    });

    render(<HomePageClient eventConfig={eventConfig} />);

    await waitFor(() => {
      expect(screen.getByText("No hay lotes activos en este momento.")).toBeInTheDocument();
    });
  });

  it("handles copy alias functionality", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "No active batch found" }),
    });

    render(<HomePageClient eventConfig={eventConfig} />);

    const copyBtn = screen.getByRole("button", { name: "Copiar alias" });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("casatomada.mp");
    
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "¡Copiado!" })).toBeInTheDocument();
    });

    // Wait for the text to revert back
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copiar alias" })).toBeInTheDocument();
    }, { timeout: 2500 });
  });

  it("uses MP_DEEP_LINK env var when set", () => {
    process.env.MP_DEEP_LINK = "https://link.mercadopago.com.ar/otro-link";
    expect(getEventConfig().mpDeepLink).toBe("https://link.mercadopago.com.ar/otro-link");
    delete process.env.MP_DEEP_LINK;
  });

  it("handles copy phone functionality", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "No active batch found" }),
    });

    render(<HomePageClient eventConfig={eventConfig} />);

    const copyBtn = screen.getByRole("button", { name: /Copiar teléfono/ });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("+54 9 11 1234-5678");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "¡Copiado!" })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Copiar teléfono/ })).toBeInTheDocument();
    }, { timeout: 2500 });
  });
});
