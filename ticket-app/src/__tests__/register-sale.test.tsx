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

  it("renders the form initially with default values", async () => {
    mockBuyersFetch();
    render(<RegisterSalePage />);

    expect(screen.getByText("Registrar compra")).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/)).toHaveValue("");
    expect(screen.getByLabelText("Válido por")).toHaveValue(1);
    expect(screen.getByRole("button", { name: "Confirmar compra" })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText("Compradores")).toBeInTheDocument();
    });
  });

  it("enables the submit button only when name is filled", () => {
    mockBuyersFetch();
    render(<RegisterSalePage />);

    const nameInput = screen.getByLabelText(/Nombre/);
    const submitBtn = screen.getByRole("button", { name: "Confirmar compra" });

    expect(submitBtn).toBeDisabled();

    fireEvent.change(nameInput, { target: { value: "Pedro Gómez" } });
    expect(submitBtn).toBeEnabled();

    fireEvent.change(nameInput, { target: { value: "   " } });
    expect(submitBtn).toBeDisabled();
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
          codeWord: "lombriz roja del monte",
          qrToken: "620671fe-2b30-43d0-a54a-bc5b2950b614",
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

    const nameInput = screen.getByLabelText(/Nombre/);
    const submitBtn = screen.getByRole("button", { name: "Confirmar compra" });

    fireEvent.change(nameInput, { target: { value: "Pedro Gómez" } });
    fireEvent.click(submitBtn);

    expect(mockFetch).toHaveBeenCalledWith("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerName: "Pedro Gómez",
        price: 10000,
        ticketCount: 1,
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
    expect(screen.getByLabelText(/Nombre/)).toHaveValue("");
    expect(screen.getByLabelText("Válido por")).toHaveValue(1);
  });

  it("submits the selected price and ticket count", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          qrDataUrl: "data:image/png;base64,mockqr",
          codeWord: "marmota azul de la esquina",
          qrToken: "abcd1234-2b30-43d0-a54a-bc5b2950b9f1",
          ticketCount: 3,
        }),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

    render(<RegisterSalePage />);

    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: "Ana Díaz" } });
    fireEvent.change(screen.getByLabelText("Precio"), { target: { value: "15000" } });
    fireEvent.change(screen.getByLabelText("Válido por"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compra" }));

    expect(mockFetch).toHaveBeenCalledWith("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerName: "Ana Díaz",
        price: 15000,
        ticketCount: 3,
      }),
    });

    await waitFor(() => {
      expect(screen.getByText("¡Listo!")).toBeInTheDocument();
    });
    expect(screen.getByText(/3 entradas/)).toBeInTheDocument();
  });

  it("clamps the ticket count to a minimum of 1", () => {
    mockBuyersFetch();
    render(<RegisterSalePage />);

    const ticketInput = screen.getByLabelText("Válido por");
    fireEvent.change(ticketInput, { target: { value: "0" } });
    expect(ticketInput).toHaveValue(1);

    fireEvent.change(ticketInput, { target: { value: "-5" } });
    expect(ticketInput).toHaveValue(1);
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

    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: "Pedro Gómez" } });
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

    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: "Pedro Gómez" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compra" }));

    await waitFor(() => {
      expect(screen.getByText("No se pudo conectar con el servidor. Intentá de nuevo.")).toBeInTheDocument();
    });
  });
});
