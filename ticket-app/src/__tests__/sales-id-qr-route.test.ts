import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { GET } from "../app/api/sales/[id]/qr/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sale: {
      findUnique: vi.fn(),
    },
  },
}));

function makeRequest(id: string) {
  return new NextRequest(`http://localhost:3000/api/sales/${id}/qr`);
}

describe("GET /api/sales/[id]/qr", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.USER;
    delete process.env.PASSWORD;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("blocks the request with 401 if auth is configured but missing", async () => {
    process.env.USER = "mariano";
    process.env.PASSWORD = "casa123tomada";

    const res = await GET(makeRequest("abc-123"), {
      params: { id: "abc-123" },
    });

    expect(res.status).toBe(401);
  });

  it("returns 404 when the sale does not exist", async () => {
    vi.mocked(prisma.sale.findUnique).mockResolvedValueOnce(null);

    const res = await GET(makeRequest("missing-id"), {
      params: { id: "missing-id" },
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Venta no encontrada");
  });

  it("regenerates the QR for an existing sale", async () => {
    vi.mocked(prisma.sale.findUnique).mockResolvedValueOnce({
      id: "abc-123",
      buyerName: "Juan Pérez",
      codeWord: "lombriz roja del monte",
      qrToken: "qr-token-001",
      price: 10000,
      ticketCount: 2,
      used: false,
      usedAt: null,
      createdAt: new Date("2026-05-29T10:00:00.000Z"),
    } as any);

    const res = await GET(makeRequest("abc-123"), {
      params: { id: "abc-123" },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.qrToken).toBe("qr-token-001");
    expect(body.codeWord).toBe("lombriz roja del monte");
    expect(body.ticketCount).toBe(2);
    expect(body.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(prisma.sale.findUnique).toHaveBeenCalledWith({
      where: { id: "abc-123" },
    });
  });
});
