import { render, screen } from "@testing-library/react";
import { getEventConfig } from "@/config";
import EntradasSection from "../app/sections/tickets-section";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const eventConfig = getEventConfig();

const noop = vi.fn();

function renderEntradas(priceInfo: {
  currentTierIndex: number;
  currentPrice: number;
  nextPrice: number | null;
  changeAt: Date | null;
  currentLabel: string;
}) {
  render(
    <EntradasSection
      eventConfig={eventConfig}
      priceInfo={priceInfo}
      countdown={null}
      aliasCopied={false}
      phoneCopied={false}
      onCopyAlias={noop}
      onCopyPhone={noop}
      onBack={noop}
    />,
  );
}

describe("EntradasSection price tiers", () => {
  it("does not show strikethrough when the first tier is active", () => {
    renderEntradas({
      currentTierIndex: 0,
      currentPrice: 10000,
      nextPrice: 13000,
      changeAt: new Date("2026-06-24T03:00:00Z"),
      currentLabel: "pajarito tempranero",
    });

    expect(document.querySelectorAll("p.line-through")).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: /pajarito tempranero/i }),
    ).toBeInTheDocument();
  });

  it("shows the first tier strikethrough when the second tier is active", () => {
    renderEntradas({
      currentTierIndex: 1,
      currentPrice: 13000,
      nextPrice: 15000,
      changeAt: new Date("2026-07-02T03:00:00Z"),
      currentLabel: "primera tanda",
    });

    const pastTier = screen.getByText(/pajarito tempranero \$10\.000/);
    expect(pastTier).toHaveClass("line-through");
    expect(
      screen.getByRole("button", { name: /primera tanda/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/segunda tanda \$15\.000/)).toBeInTheDocument();
    expect(
      screen.getByText(/entradas en puerta \$20\.000/),
    ).toBeInTheDocument();
  });

  it("shows all past tiers strikethrough when the third tier is active", () => {
    renderEntradas({
      currentTierIndex: 2,
      currentPrice: 15000,
      nextPrice: null,
      changeAt: null,
      currentLabel: "segunda tanda",
    });

    expect(screen.getByText(/pajarito tempranero \$10\.000/)).toHaveClass(
      "line-through",
    );
    expect(screen.getByText(/primera tanda \$13\.000/)).toHaveClass(
      "line-through",
    );
    expect(
      screen.getByRole("button", { name: /segunda tanda/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/entradas en puerta \$20\.000/)).not.toHaveClass(
      "line-through",
    );
  });

  it("shows segunda tanda struck through and hides payment instructions when entradas en puerta is active", () => {
    renderEntradas({
      currentTierIndex: 3,
      currentPrice: 20000,
      nextPrice: null,
      changeAt: null,
      currentLabel: "entradas en puerta",
    });

    expect(screen.getByText(/segunda tanda \$15\.000/)).toHaveClass(
      "line-through",
    );
    expect(
      screen.getByRole("button", { name: /entradas en puerta/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(eventConfig.alias)).not.toBeInTheDocument();
  });
});
