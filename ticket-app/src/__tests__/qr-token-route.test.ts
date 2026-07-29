import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "../app/api/qr/[token]/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sale: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

function makeRequest(method: "GET" | "POST", token: string) {
  return new NextRequest(`http://localhost:3000/api/qr/${token}`, { method });
}

describe("GET /api/qr/[token]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns found:false when the sale doesn't exist", async () => {
    vi.mocked(prisma.sale.findUnique).mockResolvedValueOnce(null);

    const res = await GET(makeRequest("GET", "unknown"), {
      params: { token: "unknown" },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ found: false });
  });

  it("includes the outdated flag in the response", async () => {
    vi.mocked(prisma.sale.findUnique).mockResolvedValueOnce({
      used: false,
      outdated: true,
      buyerName: "Juan",
      ticketCount: 1,
      usedAt: null,
    } as any);

    const res = await GET(makeRequest("GET", "abc"), {
      params: { token: "abc" },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ found: true, outdated: true });
  });
});

describe("POST /api/qr/[token]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects an outdated ticket with 400 before marking it used", async () => {
    vi.mocked(prisma.sale.findUnique).mockResolvedValueOnce({
      used: false,
      outdated: true,
    } as any);

    const res = await POST(makeRequest("POST", "abc"), {
      params: { token: "abc" },
    });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("QR is outdated");
    expect(prisma.sale.update).not.toHaveBeenCalled();
  });

  it("rejects an already-used ticket with 400", async () => {
    vi.mocked(prisma.sale.findUnique).mockResolvedValueOnce({
      used: true,
      outdated: false,
    } as any);

    const res = await POST(makeRequest("POST", "abc"), {
      params: { token: "abc" },
    });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("QR already used");
  });

  it("marks a valid, non-outdated ticket as used", async () => {
    vi.mocked(prisma.sale.findUnique).mockResolvedValueOnce({
      used: false,
      outdated: false,
    } as any);
    vi.mocked(prisma.sale.update).mockResolvedValueOnce({
      used: true,
      buyerName: "Juan",
      ticketCount: 1,
      usedAt: "2026-07-10T00:00:00.000Z",
    } as any);

    const res = await POST(makeRequest("POST", "abc"), {
      params: { token: "abc" },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ found: true, used: true });
  });
});
