import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RegisterSalePage from "../app/admin/register-sale/page";

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mirrors getCurrentPrice() in the component so this test doesn't go stale
// as real time crosses the pricing-tier thresholds.
function getCurrentDefaultPrice(): number {
  const now = new Date();
  if (now < new Date("2026-06-24T03:00:00Z")) return 10000;
  if (now < new Date("2026-07-02T03:00:00Z")) return 13000;
  return 15000;
}

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
    expect(
      screen.getByRole("button", { name: "Confirmar compra" }),
    ).toBeDisabled();

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
        json: () =>
          Promise.resolve({
            qrDataUrl: "data:image/png;base64,mockqr",
            codeWord: "lombriz roja del monte",
            qrToken: "mock-qr-token-aaa",
            ticketCount: 1,
          }),
      })
      .mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: "1",
              buyerName: "Pedro Gómez",
              codeWord: "lombriz roja del monte",
              qrToken: "mock-qr-token-aaa",
              ticketCount: 1,
              used: false,
              createdAt: "2026-05-29",
            },
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
        price: getCurrentDefaultPrice(),
        ticketCount: 1,
        distinctQrs: false,
      }),
    });

    await waitFor(() => {
      expect(screen.getByText("¡Listo!")).toBeInTheDocument();
    });

    expect(screen.getByAltText("QR de entrada")).toHaveAttribute(
      "src",
      "data:image/png;base64,mockqr",
    );
    expect(screen.getByText("Válido para")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Pedro Gómez")).toBeInTheDocument();
    });

    const newSaleBtn = screen.getByRole("button", {
      name: "Registrar otra compra",
    });
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
        json: () =>
          Promise.resolve({
            qrDataUrl: "data:image/png;base64,mockqr",
            codeWord: "marmota azul de la esquina",
            qrToken: "mock-qr-token-bbb",
            ticketCount: 3,
          }),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

    render(<RegisterSalePage />);

    fireEvent.change(screen.getByLabelText(/Nombre/), {
      target: { value: "Ana Díaz" },
    });
    fireEvent.change(screen.getByLabelText("Precio"), {
      target: { value: "15000" },
    });
    fireEvent.change(screen.getByLabelText("Válido por"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compra" }));

    expect(mockFetch).toHaveBeenCalledWith("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerName: "Ana Díaz",
        price: 15000,
        ticketCount: 3,
        distinctQrs: false,
      }),
    });

    await waitFor(() => {
      expect(screen.getByText("¡Listo!")).toBeInTheDocument();
    });
    expect(screen.getByText(/3 entradas/)).toBeInTheDocument();
  });

  it("shows Gratis option in the price dropdown and can submit with price 0", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            qrDataUrl: "data:image/png;base64,mockqr",
            codeWord: "lombriz roja del monte",
            qrToken: "mock-qr-token-ccc",
            ticketCount: 1,
          }),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

    render(<RegisterSalePage />);

    const priceSelect = screen.getByLabelText("Precio");
    expect(screen.getByRole("option", { name: "Gratis" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Nombre/), {
      target: { value: "Invitado VIP" },
    });
    fireEvent.change(priceSelect, { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compra" }));

    expect(mockFetch).toHaveBeenCalledWith("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerName: "Invitado VIP",
        price: 0,
        ticketCount: 1,
        distinctQrs: false,
      }),
    });

    await waitFor(() => {
      expect(screen.getByText("¡Listo!")).toBeInTheDocument();
    });
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

  it("always shows the 'Generar QRs distintos' checkbox, disabled when ticket count is 1", () => {
    mockBuyersFetch();
    render(<RegisterSalePage />);

    expect(screen.getByLabelText(/Generar QRs distintos/)).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Válido por"), {
      target: { value: "2" },
    });
    expect(screen.getByLabelText(/Generar QRs distintos/)).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Válido por"), {
      target: { value: "1" },
    });
    expect(screen.getByLabelText(/Generar QRs distintos/)).toBeDisabled();
  });

  it("unchecks 'Generar QRs distintos' when ticket count drops back to 1", () => {
    mockBuyersFetch();
    render(<RegisterSalePage />);

    fireEvent.change(screen.getByLabelText("Válido por"), {
      target: { value: "3" },
    });
    const checkbox = screen.getByLabelText(/Generar QRs distintos/);
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.change(screen.getByLabelText("Válido por"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Válido por"), {
      target: { value: "2" },
    });
    expect(screen.getByLabelText(/Generar QRs distintos/)).not.toBeChecked();
  });

  it("sends distinctQrs true and renders one card per generated QR", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ticketCount: 3,
            tickets: [
              {
                qrDataUrl: "data:image/png;base64,mockqr1",
                codeWord: "lombriz roja del monte",
                qrToken: "mock-qr-token-111",
              },
              {
                qrDataUrl: "data:image/png;base64,mockqr2",
                codeWord: "marmota azul de la esquina",
                qrToken: "mock-qr-token-222",
              },
              {
                qrDataUrl: "data:image/png;base64,mockqr3",
                codeWord: "capibara verde de la terraza",
                qrToken: "mock-qr-token-333",
              },
            ],
          }),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

    render(<RegisterSalePage />);

    fireEvent.change(screen.getByLabelText(/Nombre/), {
      target: { value: "Grupo Grande" },
    });
    fireEvent.change(screen.getByLabelText("Precio"), {
      target: { value: "15000" },
    });
    fireEvent.change(screen.getByLabelText("Válido por"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByLabelText(/Generar QRs distintos/));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compra" }));

    expect(mockFetch).toHaveBeenCalledWith("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerName: "Grupo Grande",
        price: 15000,
        ticketCount: 3,
        distinctQrs: true,
      }),
    });

    await waitFor(() => {
      expect(screen.getByText("¡Listo!")).toBeInTheDocument();
    });

    expect(screen.getAllByAltText("QR de entrada")).toHaveLength(3);
    expect(screen.getByText("Entrada 1 de 3")).toBeInTheDocument();
    expect(screen.getByText("Entrada 3 de 3")).toBeInTheDocument();
    expect(screen.getByText("marmota azul de la esquina")).toBeInTheDocument();
  });

  it("displays error message if the API call fails", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            error: "El código de promo no es válido.",
          }),
      });

    render(<RegisterSalePage />);

    fireEvent.change(screen.getByLabelText(/Nombre/), {
      target: { value: "Pedro Gómez" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compra" }));

    await waitFor(() => {
      expect(
        screen.getByText("El código de promo no es válido."),
      ).toBeInTheDocument();
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

    fireEvent.change(screen.getByLabelText(/Nombre/), {
      target: { value: "Pedro Gómez" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar compra" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "No se pudo conectar con el servidor. Intentá de nuevo.",
        ),
      ).toBeInTheDocument();
    });
  });
});
