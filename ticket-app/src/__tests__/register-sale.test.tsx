import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterSalePage from "../app/register-sale/page";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("RegisterSalePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockBuyersFetch(sales: unknown[] = []) {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(sales),
    });
  }

  it("renders the form initially with empty fields", async () => {
    mockBuyersFetch();
    render(<RegisterSalePage />);

    expect(screen.getByText("Registrar compra")).toBeInTheDocument();
    expect(screen.getByLabelText(/Tu nombre/)).toHaveValue("");
    expect(screen.getByLabelText(/Código de promo/)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Confirmar compra" })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText("Compradores")).toBeInTheDocument();
    });
  });

  it("enables the submit button only when name is filled", () => {
    mockBuyersFetch();
    render(<RegisterSalePage />);

    const nameInput = screen.getByLabelText(/Tu nombre/);
    const submitBtn = screen.getByRole("button", { name: "Confirmar compra" });

    fireEvent.change(nameInput, { target: { value: "Pedro Gómez" } });
    expect(submitBtn).toBeEnabled();
  });

  it("submits the form successfully and displays the QR code", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          qrDataUrl: "data:image/png;base64,mockqr",
          ticketCount: 1,
        }),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          { id: "1", buyerName: "Pedro Gómez", ticketCount: 1, used: false, createdAt: "2026-05-29" },
        ]),
      });

    render(<RegisterSalePage />);

    const nameInput = screen.getByLabelText(/Tu nombre/);
    const promoInput = screen.getByLabelText(/Código de promo/);
    const submitBtn = screen.getByRole("button", { name: "Confirmar compra" });

    fireEvent.change(nameInput, { target: { value: "Pedro Gómez" } });
    fireEvent.change(promoInput, { target: { value: "tanda1" } });
    fireEvent.click(submitBtn);

    expect(mockFetch).toHaveBeenCalledWith("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerName: "Pedro Gómez",
        promoCode: "TANDA1",
      }),
    });

    await waitFor(() => {
      expect(screen.getByText("¡Listo!")).toBeInTheDocument();
    });

    expect(screen.getByAltText("QR de entrada")).toHaveAttribute(
      "src",
      "data:image/png;base64,mockqr"
    );
    expect(screen.getByText("Válido para")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Pedro Gómez")).toBeInTheDocument();
    });

    const newSaleBtn = screen.getByRole("button", { name: "Registrar otra compra" });
    fireEvent.click(newSaleBtn);

    expect(screen.getByText("Registrar compra")).toBeInTheDocument();
    expect(screen.getByLabelText(/Tu nombre/)).toHaveValue("");
    expect(screen.getByLabelText(/Código de promo/)).toHaveValue("");
  });

  it("displays error message if the API call fails", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: "El código de promo no es válido.",
        }),
      });

    render(<RegisterSalePage />);

    fireEvent.change(screen.getByLabelText(/Tu nombre/), { target: { value: "Pedro Gómez" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compra" }));

    await waitFor(() => {
      expect(screen.getByText("El código de promo no es válido.")).toBeInTheDocument();
    });
  });

  it("displays default error message on network failure", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockRejectedValueOnce(new Error("Network error"));

    render(<RegisterSalePage />);

    fireEvent.change(screen.getByLabelText(/Tu nombre/), { target: { value: "Pedro Gómez" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compra" }));

    await waitFor(() => {
      expect(screen.getByText("No se pudo conectar con el servidor. Intentá de nuevo.")).toBeInTheDocument();
    });
  });
});
