import { render, screen } from "@testing-library/react";
import ComoLlegarPage from "../app/como-llegar/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => [] }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ComoLlegarPage", () => {
  it("shows the venue address with a Google Maps icon button", () => {
    render(<ComoLlegarPage />);

    expect(
      screen.getByText("Miguel Azcuénaga 183, M5513 Godoy Cruz, Mendoza"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver en Google Maps" }),
    ).toHaveAttribute("href", "https://maps.app.goo.gl/vHtkdR1bvJE78CDz7");
  });

  it("lists every bus line that gets to the venue", () => {
    render(<ComoLlegarPage />);

    for (const line of ["466", "462", "463", "812", "813", "920", "945"]) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
  });

  it("links to the whatsapp group", () => {
    render(<ComoLlegarPage />);

    expect(screen.getByRole("link", { name: "grupo" })).toHaveAttribute(
      "href",
      expect.stringContaining("chat.whatsapp.com"),
    );
  });

  it("shows the empty carpool board once posts load", async () => {
    render(<ComoLlegarPage />);

    expect(
      await screen.findByText(/Todavía no hay publicaciones/),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/ride-posts");
  });
});
