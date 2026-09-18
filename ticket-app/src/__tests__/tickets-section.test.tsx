import { render, screen } from "@testing-library/react";
import { getEventConfig } from "@/config";
import { ADMIN_ONLY_PRICES, type PriceInfo } from "@/lib/pricing";
import EntradasSection from "../app/sections/tickets-section";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const eventConfig = getEventConfig();

const noop = vi.fn();

function renderEntradas({
  priceInfo,
  countdown = null,
  saleClosed = false,
}: {
  priceInfo: PriceInfo | null;
  countdown?: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
  saleClosed?: boolean;
}) {
  render(
    <EntradasSection
      eventConfig={eventConfig}
      priceInfo={priceInfo}
      countdown={countdown}
      saleClosed={saleClosed}
      aliasCopied={false}
      phoneCopied={false}
      onCopyAlias={noop}
      onCopyPhone={noop}
      onBack={noop}
    />,
  );
}

describe("EntradasSection price tiers", () => {
  it("shows the first tier active with upcoming tiers listed below", () => {
    renderEntradas({
      priceInfo: {
        currentTierIndex: 0,
        currentPrice: 10000,
        currentLabel: "pajarito tempranero",
        nextPrice: null,
        changeAt: null,
      },
    });

    expect(document.querySelectorAll("p.line-through")).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: /pajarito tempranero \$10\.000/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/primera tanda \$12\.000/)).toBeInTheDocument();
    expect(screen.getByText(/segunda tanda \$14\.000/)).toBeInTheDocument();
    expect(screen.queryByText(/sube a/)).not.toBeInTheDocument();
    expect(screen.getByText(eventConfig.alias)).toBeInTheDocument();
  });

  it("never shows admin-only discount prices on the landing page", () => {
    renderEntradas({
      priceInfo: {
        currentTierIndex: 0,
        currentPrice: 10000,
        currentLabel: "pajarito tempranero",
        nextPrice: null,
        changeAt: null,
      },
    });

    for (const p of ADMIN_ONLY_PRICES) {
      const formatted = `$${p.toLocaleString("es-AR")}`;
      expect(document.body.textContent).not.toContain(formatted);
    }
  });

  it("shows a countdown to the next price when the change is scheduled", () => {
    renderEntradas({
      priceInfo: {
        currentTierIndex: 0,
        currentPrice: 10000,
        currentLabel: "pajarito tempranero",
        nextPrice: 12000,
        changeAt: new Date("2026-09-20T03:00:00Z"),
      },
      countdown: { days: 5, hours: 3, minutes: 2, seconds: 1 },
    });

    expect(screen.getByText(/sube a \$12\.000 en:/)).toBeInTheDocument();
    expect(screen.getByText("05")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("strikes through past tiers when the second tier is active", () => {
    renderEntradas({
      priceInfo: {
        currentTierIndex: 1,
        currentPrice: 12000,
        currentLabel: "primera tanda",
        nextPrice: null,
        changeAt: null,
      },
    });

    expect(screen.getByText(/pajarito tempranero \$10\.000/)).toHaveClass(
      "line-through",
    );
    expect(
      screen.getByRole("button", { name: /primera tanda \$12\.000/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/segunda tanda \$14\.000/)).not.toHaveClass(
      "line-through",
    );
  });

  it("strikes through all past tiers when the last tier is active", () => {
    renderEntradas({
      priceInfo: {
        currentTierIndex: 2,
        currentPrice: 14000,
        currentLabel: "segunda tanda",
        nextPrice: null,
        changeAt: null,
      },
    });

    expect(screen.getByText(/pajarito tempranero \$10\.000/)).toHaveClass(
      "line-through",
    );
    expect(screen.getByText(/primera tanda \$12\.000/)).toHaveClass(
      "line-through",
    );
    expect(
      screen.getByRole("button", { name: /segunda tanda \$14\.000/ }),
    ).toBeInTheDocument();
  });

  it("hides the price list and payment instructions once the sale is closed", () => {
    renderEntradas({ priceInfo: null, saleClosed: true });

    expect(
      screen.queryByRole("button", { name: /\$1\d\.000/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(eventConfig.alias)).not.toBeInTheDocument();
    expect(screen.getByAltText("evento")).toBeInTheDocument();
  });
});
