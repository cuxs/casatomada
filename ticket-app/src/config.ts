export type EventConfig = {
  alias: string;
  phone: string;
  mpDeepLink: string;
};

const DEFAULT_EVENT_CONFIG: EventConfig = {
  alias: "casatomada.mp",
  phone: "+54 9 11 1234-5678",
  mpDeepLink: "https://link.mercadopago.com.ar/casatomada",
};

export function getEventConfig(): EventConfig {
  return {
    ...DEFAULT_EVENT_CONFIG,
    mpDeepLink: process.env.MP_DEEP_LINK ?? DEFAULT_EVENT_CONFIG.mpDeepLink,
  };
}
