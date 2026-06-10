import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomePageClient from "../app/HomePageClient";
import { getEventConfig } from "@/config";

const eventConfig = getEventConfig();

describe("HomePage", () => {
  it("renders hero with navigation buttons", () => {
    render(<HomePageClient eventConfig={eventConfig} />);

    expect(screen.getByText("manifiest@")).toBeInTheDocument();
    expect(screen.getByText("rizoma 001")).toBeInTheDocument();
    expect(screen.getByText("entradas")).toBeInTheDocument();
  });

  it("shows entradas section when entradas button is clicked", async () => {
    render(<HomePageClient eventConfig={eventConfig} />);

    fireEvent.click(screen.getByText("entradas"));

    await waitFor(() => {
      expect(screen.getByText("casatomada.mp")).toBeInTheDocument();
      expect(screen.getByText("+542613827157")).toBeInTheDocument();
    });
  });

  it("shows manifiest@ section when manifiest@ button is clicked", () => {
    render(<HomePageClient eventConfig={eventConfig} />);

    fireEvent.click(screen.getByText("manifiest@"));

    expect(screen.getByText("_maniest@")).toBeInTheDocument();
  });

  it("shows rizoma section when rizoma 001 button is clicked", () => {
    render(<HomePageClient eventConfig={eventConfig} />);

    fireEvent.click(screen.getByText("rizoma 001"));

    expect(screen.getByText("full video")).toBeInTheDocument();
  });

  it("handles copy alias functionality", async () => {
    render(<HomePageClient eventConfig={eventConfig} />);

    // Navigate to entradas first
    fireEvent.click(screen.getByText("entradas"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "copiar el alias" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "copiar el alias" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("casatomada.mp");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "¡copiado!" })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "copiar el alias" })).toBeInTheDocument();
    }, { timeout: 2500 });
  });

  it("handles copy phone functionality", async () => {
    render(<HomePageClient eventConfig={eventConfig} />);

    // Navigate to entradas first
    fireEvent.click(screen.getByText("entradas"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "copiar el número" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "copiar el número" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("+542613827157");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "¡copiado!" })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "copiar el número" })).toBeInTheDocument();
    }, { timeout: 2500 });
  });

  it("uses MP_DEEP_LINK env var when set", () => {
    process.env.MP_DEEP_LINK = "https://link.mercadopago.com.ar/otro-link";
    expect(getEventConfig().mpDeepLink).toBe("https://link.mercadopago.com.ar/otro-link");
    delete process.env.MP_DEEP_LINK;
  });

  it("shows sold out state when soldOut is true", () => {
    render(<HomePageClient eventConfig={{ ...eventConfig, soldOut: true }} />);

    fireEvent.click(screen.getByText("entradas"));

    expect(screen.getByText("sold out")).toBeInTheDocument();
    expect(screen.getByText("gracias, nos vemos en la pista we")).toBeInTheDocument();
  });
});
