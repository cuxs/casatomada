import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { GET } from "../app/api/guardarropa/search/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sale: {
      findMany: vi.fn(),
    },
  },
}));

function makeRequest(query?: string) {
  const url =
    query === undefined
      ? "http://localhost:3000/api/guardarropa/search"
      : `http://localhost:3000/api/guardarropa/search?query=${encodeURIComponent(query)}`;
  return new NextRequest(url);
}

describe("GET /api/guardarropa/search", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.USER;
    delete process.env.PASSWORD;
    delete process.env.GUARDARROPA_USER;
    delete process.env.GUARDARROPA_PASSWORD;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("blocks the request with 401 if auth is configured but missing", async () => {
    process.env.GUARDARROPA_USER = "ropa";
    process.env.GUARDARROPA_PASSWORD = "ropapass";

    const res = await GET(makeRequest("9f3"));

    expect(res.status).toBe(401);
  });

  it("requires a query", async () => {
    for (const req of [makeRequest(), makeRequest("   ")]) {
      const res = await GET(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("La búsqueda es requerida");
    }
    expect(prisma.sale.findMany).not.toHaveBeenCalled();
  });

  it("searches by the ticket's last-3-character code, case-insensitively, capped at 10 results", async () => {
    vi.mocked(prisma.sale.findMany).mockResolvedValueOnce([
      {
        id: "s1",
        qrToken: "aaaa1111-bbbb-cccc-dddd-eeeeeee9f3",
        buyerName: "Ana",
        guardarropaChecks: [{ id: "check-1" }],
      },
      {
        id: "s2",
        qrToken: "ffff2222-gggg-hhhh-iiii-jjjjjjj9F3",
        buyerName: "Juan",
        guardarropaChecks: [],
      },
    ] as any);

    const res = await GET(makeRequest("9F3"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toEqual([
      {
        saleId: "s1",
        code: "9F3",
        buyerName: "Ana",
        activeDeposits: 1,
      },
      {
        saleId: "s2",
        code: "9F3",
        buyerName: "Juan",
        activeDeposits: 0,
      },
    ]);
    expect(prisma.sale.findMany).toHaveBeenCalledWith({
      where: { qrToken: { endsWith: "9F3", mode: "insensitive" } },
      orderBy: { buyerName: "asc" },
      take: 10,
      include: {
        guardarropaChecks: {
          where: { retrievedAt: null },
          select: { id: true },
        },
      },
    });
  });
});
