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
    expect(PRICE_TIERS.map((t) => t.price)).toEqual([10000, 13000, 15000]);
  });

  it("accepts free tickets plus every tier price", () => {
    expect(VALID_PRICES).toEqual([0, 6500, 10000, 13000, 15000]);
    expect(DEFAULT_PRICE).toBe(10000);
  });

  it("keeps admin-only prices out of the public tiers", () => {
    expect(ADMIN_ONLY_PRICES).toEqual([6500]);
    for (const p of ADMIN_ONLY_PRICES) {
      expect(PRICE_TIERS.map((t) => t.price)).not.toContain(p);
      expect(VALID_PRICES).toContain(p);
    }
  });

  it("starts on pajarito tempranero until Sep 28 00:00 Buenos Aires", () => {
    const info = getPriceInfo(new Date("2026-09-14T12:00:00Z"));
    expect(info).toEqual({
      currentTierIndex: 0,
      currentPrice: 10000,
      currentLabel: "pajarito tempranero",
      nextPrice: 13000,
      changeAt: new Date("2026-09-28T03:00:00Z"),
    });
    expect(getCurrentPrice(new Date("2026-09-28T02:59:59Z"))).toBe(10000);
  });

  it("switches to primera tanda on Sep 28 until Oct 1 00:00 Buenos Aires", () => {
    const info = getPriceInfo(new Date("2026-09-28T03:00:00Z"));
    expect(info).toEqual({
      currentTierIndex: 1,
      currentPrice: 13000,
      currentLabel: "primera tanda",
      nextPrice: 15000,
      changeAt: new Date("2026-10-01T03:00:00Z"),
    });
    expect(getCurrentPrice(new Date("2026-10-01T02:59:59Z"))).toBe(13000);
  });

  it("ends segunda tanda at the sale cutoff with no next price", () => {
    const info = getPriceInfo(new Date("2026-10-01T03:00:00Z"));
    expect(info).toEqual({
      currentTierIndex: 2,
      currentPrice: 15000,
      currentLabel: "segunda tanda",
      nextPrice: null,
      changeAt: SALE_CUTOFF,
    });
    expect(SALE_CUTOFF).toEqual(new Date("2026-10-03T00:00:00Z"));
  });
});
