export type EventConfig = {
  alias: string;
  phone: string;
  soldOut: boolean;
};

const DEFAULT_EVENT_CONFIG: EventConfig = {
  alias: "arte.y.resistencia",
  phone: "+5492615888052",
  soldOut: false,
};

export function getEventConfig(): EventConfig {
  return {
    ...DEFAULT_EVENT_CONFIG,
    soldOut: process.env.SOLD_OUT === "true",
  };
}
