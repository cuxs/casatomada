import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CheckQRPage from "../app/check-qr/page";

const mockGet = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("CheckQRPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders manual input form when no token is in URL", async () => {
    mockGet.mockReturnValue(null);
    render(<CheckQRPage />);

    expect(screen.getByPlaceholderText("Pegá el token del QR")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Validar" })).toBeDisabled();
  });

  it("allows entering token manually and searching", async () => {
    mockGet.mockReturnValue(null);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        found: true,
        used: false,
        buyerName: "Juan Pérez",
        ticketCount: 2,
        usedAt: null,
      }),
    });

    render(<CheckQRPage />);

    const input = screen.getByPlaceholderText("Pegá el token del QR");
    const button = screen.getByRole("button", { name: "Validar" });

    fireEvent.change(input, { target: { value: "test-token-123" } });
    expect(button).toBeEnabled();

    fireEvent.click(button);

    expect(mockFetch).toHaveBeenCalledWith("/api/qr/test-token-123");

    await waitFor(() => {
      expect(screen.getByText("QR válido")).toBeInTheDocument();
    });

    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar como usado" })).toBeInTheDocument();
  });

  it("auto-fetches when token is provided in URL", async () => {
    mockGet.mockReturnValue("url-token-abc");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        found: true,
        used: false,
        buyerName: "María López",
        ticketCount: 1,
        usedAt: null,
      }),
    });

    render(<CheckQRPage />);

    expect(mockFetch).toHaveBeenCalledWith("/api/qr/url-token-abc");

    await waitFor(() => {
      expect(screen.getByText("QR válido")).toBeInTheDocument();
    });

    expect(screen.getByText("María López")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows QR inválido warning if not found", async () => {
    mockGet.mockReturnValue("invalid-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        found: false,
        used: false,
        buyerName: "",
        ticketCount: 0,
        usedAt: null,
      }),
    });

    render(<CheckQRPage />);

    await waitFor(() => {
      expect(screen.getByText("QR inválido")).toBeInTheDocument();
    });
    expect(screen.getByText("Este código no existe en el sistema.")).toBeInTheDocument();
  });

  it("shows QR ya utilizado message if already used", async () => {
    mockGet.mockReturnValue("used-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        found: true,
        used: true,
        buyerName: "Carlos Gómez",
        ticketCount: 1,
        usedAt: "2026-05-29T10:00:00Z",
      }),
    });

    render(<CheckQRPage />);

    await waitFor(() => {
      expect(screen.getByText("QR ya utilizado")).toBeInTheDocument();
    });
    expect(screen.getByText("Carlos Gómez")).toBeInTheDocument();
    expect(screen.getByText(/Usado el/)).toBeInTheDocument();
  });

  it("allows marking a valid QR as used", async () => {
    mockGet.mockReturnValue("valid-token-to-use");
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          found: true,
          used: false,
          buyerName: "Ana Ruiz",
          ticketCount: 3,
          usedAt: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          found: true,
          used: true,
          buyerName: "Ana Ruiz",
          ticketCount: 3,
          usedAt: "2026-05-29T10:05:00Z",
        }),
      });

    render(<CheckQRPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Marcar como usado" })).toBeInTheDocument();
    });

    const markBtn = screen.getByRole("button", { name: "Marcar como usado" });
    fireEvent.click(markBtn);

    expect(mockFetch).toHaveBeenLastCalledWith("/api/qr/valid-token-to-use", {
      method: "POST",
    });

    await waitFor(() => {
      expect(screen.getByText("QR ya utilizado")).toBeInTheDocument();
    });
    expect(screen.getByText("Ana Ruiz")).toBeInTheDocument();
  });
});
