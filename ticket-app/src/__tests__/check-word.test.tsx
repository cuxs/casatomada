import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CheckWordPage from "../app/check-word/page";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function selectCodeWord(animal: string, color: string, place: string) {
  const [animalSelect, colorSelect, placeSelect] =
    screen.getAllByRole("combobox");
  fireEvent.change(animalSelect, { target: { value: animal } });
  fireEvent.change(colorSelect, { target: { value: color } });
  fireEvent.change(placeSelect, { target: { value: place } });
}

function typeSuffix(suffix: string) {
  const input = screen.getByPlaceholderText("Últimos 3 caracteres del token");
  fireEvent.change(input, { target: { value: suffix } });
}

describe("CheckWordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the animal, color, place selects and suffix input with no result yet", () => {
    render(<CheckWordPage />);

    expect(screen.getAllByRole("combobox")).toHaveLength(3);
    expect(
      screen.getByPlaceholderText("Últimos 3 caracteres del token"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Validar" }),
    ).not.toBeInTheDocument();
  });

  it("does not look up until all fields and the 3-char suffix are set", () => {
    render(<CheckWordPage />);

    selectCodeWord("lombriz", "roja", "del monte");
    typeSuffix("ab");

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("auto-looks up once the code word and suffix are complete, and shows Validar", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          found: true,
          used: false,
          buyerName: "Juan Pérez",
          ticketCount: 2,
          usedAt: null,
          qrToken: "token-123-abc",
        }),
    });

    render(<CheckWordPage />);

    selectCodeWord("lombriz", "roja", "del monte");
    typeSuffix("abc");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/qr/lookup?codeWord=lombriz%20roja%20del%20monte&suffix=abc",
    );

    await waitFor(() => {
      expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    });
    expect(screen.getByText("2")).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Validar" });
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe("Validar");
  });

  it("shows an error state when the code is not found", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          found: false,
          used: false,
          buyerName: "",
          ticketCount: 0,
          usedAt: null,
          qrToken: "",
        }),
    });

    render(<CheckWordPage />);

    selectCodeWord("lombriz", "roja", "del monte");
    typeSuffix("xyz");

    await waitFor(() => {
      expect(screen.getByText("❌")).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: "Validar" }),
    ).not.toBeInTheDocument();
  });

  it("marks the code as used when Validar is clicked", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            found: true,
            used: false,
            buyerName: "Ana Ruiz",
            ticketCount: 3,
            usedAt: null,
            qrToken: "token-to-use",
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            used: true,
            usedAt: "2026-05-29T10:05:00Z",
          }),
      });

    render(<CheckWordPage />);

    selectCodeWord("lombriz", "roja", "del monte");
    typeSuffix("abc");

    const validarButton = await screen.findByRole("button", {
      name: "Validar",
    });
    fireEvent.click(validarButton);

    expect(mockFetch).toHaveBeenLastCalledWith("/api/qr/token-to-use", {
      method: "POST",
    });

    await waitFor(() => {
      expect(screen.getByText("✅ Entrada validada")).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: "Validar" }),
    ).not.toBeInTheDocument();
  });

  it("resets the form when 'Validar otra entrada' is clicked", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          found: true,
          used: false,
          buyerName: "Juan Pérez",
          ticketCount: 2,
          usedAt: null,
          qrToken: "token-123-abc",
        }),
    });

    render(<CheckWordPage />);

    selectCodeWord("lombriz", "roja", "del monte");
    typeSuffix("abc");

    await screen.findByRole("button", { name: "Validar" });

    fireEvent.click(
      screen.getByRole("button", { name: "Validar otra entrada" }),
    );

    expect(
      screen.queryByRole("button", { name: "Validar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Validar otra entrada" }),
    ).not.toBeInTheDocument();
  });
});
