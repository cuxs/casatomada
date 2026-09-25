// Single source of truth for ticket prices. Update this file (and only
// this file) when prices or their dates change — the landing page, the
// OG metadata and every admin form / API route that accepts a price
// derive from here so they can't drift out of sync.

export interface PriceTier {
  label: string;
  price: number;
  // When this tier becomes the active price. `null` means the tier is
  // announced but not scheduled yet, so it never activates on its own.
  // The first tier is always available from the start of the sale.
  from: Date | null;
}

export const PRICE_TIERS: PriceTier[] = [
  { label: "pajarito tempranero", price: 10000, from: null },
  // 00:00 Buenos Aires, Sep 28
  {
    label: "primera tanda",
    price: 13000,
    from: new Date("2026-09-28T03:00:00Z"),
  },
  // 00:00 Buenos Aires, Oct 1
  {
    label: "segunda tanda",
    price: 15000,
    from: new Date("2026-10-01T03:00:00Z"),
  },
];

// Online sale closes when the doors open: 21:00 Buenos Aires, Oct 2.
// From then on the landing only points to the taquilla.
export const SALE_CUTOFF = new Date("2026-10-03T00:00:00Z");

export interface PriceInfo {
  currentTierIndex: number;
  currentPrice: number;
  currentLabel: string;
  nextPrice: number | null;
  // When the current tier ends: the next tier's start, or SALE_CUTOFF for
  // the last tier (nextPrice is null in that case).
  changeAt: Date | null;
}

export function getCurrentTierIndex(now: Date): number {
  let index = 0;
  for (let i = 1; i < PRICE_TIERS.length; i++) {
    const from = PRICE_TIERS[i].from;
    if (from && now >= from) index = i;
  }
  return index;
}

export function getPriceInfo(now: Date): PriceInfo {
  const currentTierIndex = getCurrentTierIndex(now);
  const current = PRICE_TIERS[currentTierIndex];
  const next = PRICE_TIERS[currentTierIndex + 1];
  return {
    currentTierIndex,
    currentPrice: current.price,
    currentLabel: current.label,
    nextPrice: next?.from ? next.price : null,
    changeAt: next ? next.from : SALE_CUTOFF,
  };
}

// Prices only available from the admin (special discounts, etc.). They
// are accepted by the sales forms and API but never shown on the landing
// page, so they don't belong in PRICE_TIERS.
export const ADMIN_ONLY_PRICES = [6500];

export const VALID_PRICES = [
  0,
  ...ADMIN_ONLY_PRICES,
  ...PRICE_TIERS.map((t) => t.price),
];

export const DEFAULT_PRICE = PRICE_TIERS[0].price;

// Price to preselect in admin forms: whatever the public is paying now.
export function getCurrentPrice(now: Date = new Date()): number {
  return getPriceInfo(now).currentPrice;
}
