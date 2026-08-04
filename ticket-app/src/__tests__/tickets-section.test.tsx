import { render, screen } from "@testing-library/react";
import { getEventConfig } from "@/config";
import EntradasSection from "../app/sections/tickets-section";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const eventConfig = getEventConfig();

const noop = vi.fn();

function renderEntradas({
  priceInfo,
  saleClosed = false,
}: {
  priceInfo: { currentPrice: number } | null;
  saleClosed?: boolean;
}) {
  render(
    <EntradasSection
      eventConfig={eventConfig}
      priceInfo={priceInfo}
      saleClosed={saleClosed}
      aliasCopied={false}
      phoneCopied={false}
      onCopyAlias={noop}
      onCopyPhone={noop}
      onBack={noop}
    />,
  );
}

describe("EntradasSection", () => {
  it("shows the current price and payment instructions while the sale is open", () => {
    renderEntradas({ priceInfo: { currentPrice: 8000 } });

    expect(
      screen.getByRole("button", { name: /entradas \$8\.000/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(eventConfig.alias)).toBeInTheDocument();
  });

  it("hides the price button and payment instructions once the sale is closed", () => {
    renderEntradas({ priceInfo: null, saleClosed: true });

    expect(
      screen.queryByRole("button", { name: /entradas \$/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(eventConfig.alias)).not.toBeInTheDocument();
    expect(screen.getByAltText("evento")).toBeInTheDocument();
  });
});
