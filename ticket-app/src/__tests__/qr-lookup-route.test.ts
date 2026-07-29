import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { GET } from "../app/api/qr/lookup/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sale: {
      findUnique: vi.fn(),
    },
    event: {
      findFirst: vi.fn(),
    },
  },
}));

function makeRequest(codeWord?: string, suffix?: string) {
  const params = new URLSearchParams();
  if (codeWord !== undefined) params.set("codeWord", codeWord);
  if (suffix !== undefined) params.set("suffix", suffix);
  return new NextRequest(
    `http://localhost:3000/api/qr/lookup?${params.toString()}`,
  );
}

describe("GET /api/qr/lookup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns found:false when codeWord is missing or suffix isn't 3 chars", async () => {
    for (const req of [
      makeRequest(undefined, "abc"),
      makeRequest("lombriz roja del monte", "ab"),
    ]) {
      const res = await GET(req);
      expect(await res.json()).toEqual({ found: false });
    }
    expect(prisma.sale.findUnique).not.toHaveBeenCalled();
  });

  it("returns found:false when there's no active event", async () => {
    vi.mocked(prisma.event.findFirst).mockResolvedValueOnce(null as any);

    const res = await GET(makeRequest("lombriz roja del monte", "abc"));

    expect(await res.json()).toEqual({ found: false });
    expect(prisma.sale.findUnique).not.toHaveBeenCalled();
  });

  it("looks up the sale scoped to the active event via the composite key", async () => {
    vi.mocked(prisma.event.findFirst).mockResolvedValueOnce({
      id: "event-1",
    } as any);
    vi.mocked(prisma.sale.findUnique).mockResolvedValueOnce({
      used: false,
      outdated: false,
      buyerName: "Juan",
      ticketCount: 1,
      usedAt: null,
      qrToken: "aaaa1111-bbbb-cccc-dddd-eeeeeeeeeabc",
    } as any);

    const res = await GET(makeRequest("lombriz roja del monte", "abc"));

    expect(prisma.sale.findUnique).toHaveBeenCalledWith({
      where: {
        eventId_codeWord: {
          eventId: "event-1",
          codeWord: "lombriz roja del monte",
        },
      },
    });
    expect(await res.json()).toMatchObject({ found: true, buyerName: "Juan" });
  });

  it("returns found:false when the token suffix doesn't match", async () => {
    vi.mocked(prisma.event.findFirst).mockResolvedValueOnce({
      id: "event-1",
    } as any);
    vi.mocked(prisma.sale.findUnique).mockResolvedValueOnce({
      used: false,
      outdated: false,
      buyerName: "Juan",
      ticketCount: 1,
      usedAt: null,
      qrToken: "aaaa1111-bbbb-cccc-dddd-eeeeeeeeezzz",
    } as any);

    const res = await GET(makeRequest("lombriz roja del monte", "abc"));

    expect(await res.json()).toEqual({ found: false });
  });

  it("doesn't leak across events sharing the same codeWord", async () => {
    vi.mocked(prisma.event.findFirst).mockResolvedValueOnce({
      id: "event-2",
    } as any);
    // The active event has no sale with this codeWord (it belongs to a
    // different event), so findUnique resolves to null for this key.
    vi.mocked(prisma.sale.findUnique).mockResolvedValueOnce(null);

    const res = await GET(makeRequest("lombriz roja del monte", "abc"));

    expect(prisma.sale.findUnique).toHaveBeenCalledWith({
      where: {
        eventId_codeWord: {
          eventId: "event-2",
          codeWord: "lombriz roja del monte",
        },
      },
    });
    expect(await res.json()).toEqual({ found: false });
  });
});
