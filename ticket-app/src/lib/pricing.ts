// Single source of truth for ticket prices. Update this list (and only
// this list) when prices change — every form and API route that accepts
// a price imports from here so they can't drift out of sync.
export const VALID_PRICES = [0, 8000];

export const DEFAULT_PRICE = 8000;
