export type EventConfig = {
  alias: string;
  phone: string;
  mpDeepLink: string;
  soldOut: boolean;
};

const DEFAULT_EVENT_CONFIG: EventConfig = {
  alias: "casatomada.mp",
  phone: "+542613827157",
  mpDeepLink: "https://link.mercadopago.com.ar/casatomada",
  soldOut: false,
};

export function getEventConfig(): EventConfig {
  return {
    ...DEFAULT_EVENT_CONFIG,
    mpDeepLink: process.env.MP_DEEP_LINK ?? DEFAULT_EVENT_CONFIG.mpDeepLink,
    soldOut: process.env.SOLD_OUT === "true",
  };
}
