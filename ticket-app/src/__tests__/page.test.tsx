import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getEventConfig } from "@/config";
import HomePageClient from "../app/home-page-client";

const eventConfig = getEventConfig();

beforeEach(() => {
  vi.clearAllMocks();
});

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
      expect(screen.getByText(eventConfig.alias)).toBeInTheDocument();
      expect(screen.getByText(eventConfig.phone)).toBeInTheDocument();
    });
  });

  it("shows manifiest@ section when manifiest@ button is clicked", () => {
    render(<HomePageClient eventConfig={eventConfig} />);

    fireEvent.click(screen.getByText("manifiest@"));

    expect(screen.getByAltText("manifiesta")).toBeInTheDocument();
  });

  it("shows rizoma section when rizoma 001 button is clicked", () => {
    render(<HomePageClient eventConfig={eventConfig} />);

    fireEvent.click(screen.getByText("rizoma 001"));

    expect(screen.getByText("full video")).toBeInTheDocument();
  });

  it("handles copy alias functionality", async () => {
    render(<HomePageClient eventConfig={eventConfig} />);

    fireEvent.click(screen.getByText("entradas"));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "copiar el alias" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "copiar el alias" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      eventConfig.alias,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "¡copiado!" }),
      ).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: "copiar el alias" }),
        ).toBeInTheDocument();
      },
      { timeout: 2500 },
    );
  });

  it("handles copy phone functionality", async () => {
    render(<HomePageClient eventConfig={eventConfig} />);

    fireEvent.click(screen.getByText("entradas"));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "copiar el número" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "copiar el número" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      eventConfig.phone,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "¡copiado!" }),
      ).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: "copiar el número" }),
        ).toBeInTheDocument();
      },
      { timeout: 2500 },
    );
  });

  it("shows sold out state when soldOut is true", () => {
    render(<HomePageClient eventConfig={{ ...eventConfig, soldOut: true }} />);

    fireEvent.click(screen.getByText("entradas"));

    expect(screen.getByText("sold out")).toBeInTheDocument();
    expect(
      screen.getByText("gracias, nos vemos en la pista we"),
    ).toBeInTheDocument();
  });

  it("shows price tiers when not sold out", async () => {
    render(<HomePageClient eventConfig={eventConfig} />);

    fireEvent.click(screen.getByText("entradas"));

    expect(await screen.findByText(/pajarito tempranero/)).toBeInTheDocument();
    expect(screen.getByText(/segunda tanda/)).toBeInTheDocument();
    expect(screen.getByText(/entradas en puerta/)).toBeInTheDocument();
    expect(screen.queryByText("sold out")).not.toBeInTheDocument();
  });

  it("shows payment instructions in entradas section", () => {
    render(<HomePageClient eventConfig={eventConfig} />);

    fireEvent.click(screen.getByText("entradas"));

    expect(
      screen.getByText(/Enviá el comprobante a este número/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/te va a llegar un QR con la entrada a tu whatsapp/),
    ).toBeInTheDocument();
  });
});

describe("manifiest@ section", () => {
  it("renders the manifesto heading and content blocks", () => {
    render(<HomePageClient eventConfig={eventConfig} />);

    fireEvent.click(screen.getByText("manifiest@"));

    expect(screen.getByAltText("manifiesta")).toBeInTheDocument();
    expect(screen.getByText(/no es una fiesta/)).toBeInTheDocument();
    expect(screen.getByText(/la salida es colectiva/)).toBeInTheDocument();
  });
});

describe("rizoma section", () => {
  it("renders participants and links to the full video", () => {
    render(<HomePageClient eventConfig={eventConfig} />);

    fireEvent.click(screen.getByText("rizoma 001"));

    const link = screen.getByText("full video").closest("a");
    expect(link).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=H_Fp5Mc9hc0&list=RDH_Fp5Mc9hc0",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByAltText("participantes")).toBeInTheDocument();
  });
});

describe("section navigation", () => {
  it("exposes a back control in each section", () => {
    render(<HomePageClient eventConfig={eventConfig} />);

    expect(
      screen.getAllByRole("button", { name: "Volver" }).length,
    ).toBeGreaterThan(0);
  });
});

describe("getEventConfig", () => {
  it("returns the default alias and phone", () => {
    const config = getEventConfig();
    expect(config.alias).toBe("arte.y.resistencia");
    expect(config.phone).toBe("+5492615888052");
    expect(config.soldOut).toBe(false);
  });

  it("marks the event as sold out when SOLD_OUT env var is 'true'", () => {
    process.env.SOLD_OUT = "true";
    expect(getEventConfig().soldOut).toBe(true);
    delete process.env.SOLD_OUT;
  });

  it("is not sold out for any other SOLD_OUT value", () => {
    process.env.SOLD_OUT = "1";
    expect(getEventConfig().soldOut).toBe(false);
    delete process.env.SOLD_OUT;
  });
});
