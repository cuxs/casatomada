import {
  ADMIN_ONLY_PRICES,
  DEFAULT_PRICE,
  getCurrentPrice,
  getPriceInfo,
  PRICE_TIERS,
  SALE_CUTOFF,
  VALID_PRICES,
} from "@/lib/pricing";

describe("pricing", () => {
  it("lists the three tiers in ascending order", () => {
    expect(PRICE_TIERS.map((t) => t.price)).toEqual([10000, 12000, 14000]);
  });

  it("accepts free tickets plus every tier price", () => {
    expect(VALID_PRICES).toEqual([0, 6500, 10000, 12000, 14000]);
    expect(DEFAULT_PRICE).toBe(10000);
  });

  it("keeps admin-only prices out of the public tiers", () => {
    expect(ADMIN_ONLY_PRICES).toEqual([6500]);
    for (const p of ADMIN_ONLY_PRICES) {
      expect(PRICE_TIERS.map((t) => t.price)).not.toContain(p);
      expect(VALID_PRICES).toContain(p);
    }
  });

  it("starts on the first tier with no scheduled change", () => {
    const info = getPriceInfo(new Date("2026-09-14T12:00:00Z"));
    expect(info).toEqual({
      currentTierIndex: 0,
      currentPrice: 10000,
      currentLabel: "pajarito tempranero",
      nextPrice: null,
      changeAt: null,
    });
    expect(getCurrentPrice(new Date("2026-09-14T12:00:00Z"))).toBe(10000);
  });

  it("stays on the first tier until later tiers get a date", () => {
    // Later tiers are unscheduled (from: null) so they must never
    // activate on their own, even right before the sale closes.
    const justBeforeCutoff = new Date(SALE_CUTOFF.getTime() - 1000);
    expect(getPriceInfo(justBeforeCutoff).currentPrice).toBe(10000);
  });
});
