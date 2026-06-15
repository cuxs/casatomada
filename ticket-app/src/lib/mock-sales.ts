import { codeWordForIndex } from "@/lib/code-words";

// Dev-only fixture data so the /sales table can be previewed with a large
// dataset without touching the real database. Enabled via MOCK_SALES=true.

const FIRST_NAMES = [
  "Juan",
  "María",
  "Pedro",
  "Lucía",
  "Martín",
  "Sofía",
  "Diego",
  "Valentina",
  "Mateo",
  "Camila",
  "Santiago",
  "Florencia",
  "Nicolás",
  "Julieta",
  "Tomás",
  "Agustina",
  "Facundo",
  "Bianca",
  "Lautaro",
  "Renata",
  "Ignacio",
  "Catalina",
  "Bruno",
  "Emilia",
  "Joaquín",
];

const LAST_NAMES = [
  "Gómez",
  "Pérez",
  "Rodríguez",
  "Fernández",
  "López",
  "Díaz",
  "Martínez",
  "García",
  "Sánchez",
  "Romero",
  "Sosa",
  "Torres",
  "Álvarez",
  "Ruiz",
  "Ramírez",
  "Flores",
  "Acosta",
  "Benítez",
  "Suárez",
  "Medina",
  "Herrera",
  "Aguirre",
  "Núñez",
  "Molina",
  "Vega",
];

const PRICES = [10000, 13000, 15000];

const DAY_MS = 24 * 60 * 60 * 1000;

export interface MockSale {
  id: string;
  buyerName: string;
  price: number;
  qrToken: string;
  codeWord: string;
  ticketCount: number;
  used: boolean;
  usedAt: Date | null;
  createdAt: Date;
}

export function generateMockSales(count: number): MockSale[] {
  const now = Date.now();

  return Array.from({ length: count }, (_, i) => {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName =
      LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const ticketCount = (i % 4) + 1;
    const used = i % 3 === 0;
    const createdAt = new Date(now - (count - i) * 3 * 60 * 60 * 1000);
    const usedAt = used ? new Date(createdAt.getTime() + DAY_MS) : null;

    return {
      id: `mock-${i}`,
      buyerName: `${firstName} ${lastName}`,
      price: PRICES[i % PRICES.length],
      qrToken: `mock-qr-token-${i}`,
      codeWord: codeWordForIndex(i),
      ticketCount,
      used,
      usedAt,
      createdAt,
    };
  }).reverse();
}
