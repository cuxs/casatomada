import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { POST } from "../app/api/events/[id]/end/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    sale: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(async (ops: any[]) => Promise.all(ops)),
  },
}));

function makeRequest(headers?: Record<string, string>) {
  return new NextRequest("http://localhost:3000/api/events/event-1/end", {
    method: "POST",
    headers,
  });
}

describe("POST /api/events/[id]/end", () => {
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

  it("blocks the request with 401 if admin auth is configured but missing", async () => {
    process.env.USER = "mariano";
    process.env.PASSWORD = "casa123tomada";

    const res = await POST(makeRequest(), { params: { id: "event-1" } });
    expect(res.status).toBe(401);
    expect(prisma.event.findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the event doesn't exist", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValueOnce(null);

    const res = await POST(makeRequest(), { params: { id: "missing" } });

    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Evento no encontrado");
  });

  it("returns 400 when the event already ended", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValueOnce({
      id: "event-1",
      ended: true,
    } as any);

    const res = await POST(makeRequest(), { params: { id: "event-1" } });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Este evento ya finalizó");
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it("marks the event as ended and inactive, and outdates all of its sales", async () => {
    vi.mocked(prisma.event.findUnique).mockResolvedValueOnce({
      id: "event-1",
      name: "Casa Tomada Aniversario",
      ended: false,
      active: true,
    } as any);

    const updatedEvent = {
      id: "event-1",
      name: "Casa Tomada Aniversario",
      ended: true,
      active: false,
    };
    vi.mocked(prisma.event.update).mockResolvedValueOnce(updatedEvent as any);
    vi.mocked(prisma.sale.updateMany).mockResolvedValueOnce({ count: 9 });

    const res = await POST(makeRequest(), { params: { id: "event-1" } });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updatedEvent);
    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: "event-1" },
      data: { ended: true, active: false },
    });
    expect(prisma.sale.updateMany).toHaveBeenCalledWith({
      where: { eventId: "event-1" },
      data: { outdated: true },
    });
  });
});
