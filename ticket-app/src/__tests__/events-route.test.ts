import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "../app/api/events/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(async (fn: any) =>
      fn({
        event: {
          updateMany: vi.fn(),
          create: vi.fn(),
        },
      }),
    ),
  },
}));

function makeGet(headers?: Record<string, string>) {
  return new NextRequest("http://localhost:3000/api/events", { headers });
}

function makePost(body: unknown, headers?: Record<string, string>) {
  return new NextRequest("http://localhost:3000/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("GET and POST /api/events - auth protection", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("blocks GET with 401 if admin auth is configured but missing", async () => {
    process.env.USER = "mariano";
    process.env.PASSWORD = "casa123tomada";

    const res = await GET(makeGet());
    expect(res.status).toBe(401);
  });

  it("blocks POST with 401 if admin auth is configured but missing", async () => {
    process.env.USER = "mariano";
    process.env.PASSWORD = "casa123tomada";

    const res = await POST(
      makePost({ name: "Nuevo evento", date: "2026-12-01" }),
    );
    expect(res.status).toBe(401);
  });

  it("allows GET when no admin auth is configured", async () => {
    delete process.env.USER;
    delete process.env.PASSWORD;
    vi.mocked(prisma.event.findMany).mockResolvedValueOnce([] as any);

    const res = await GET(makeGet());
    expect(res.status).toBe(200);
  });
});

describe("GET /api/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.USER;
    delete process.env.PASSWORD;
  });

  it("returns events ordered by date desc", async () => {
    const mockEvents = [
      { id: "1", name: "Aniversario", date: "2026-07-10", active: false },
      { id: "2", name: "Diciembre", date: "2026-12-01", active: true },
    ];
    vi.mocked(prisma.event.findMany).mockResolvedValueOnce(mockEvents as any);

    const res = await GET(makeGet());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockEvents);
    expect(prisma.event.findMany).toHaveBeenCalledWith({
      orderBy: { date: "desc" },
    });
  });
});

describe("POST /api/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.USER;
    delete process.env.PASSWORD;
  });

  it("rejects a missing name with 400", async () => {
    const res = await POST(makePost({ date: "2026-12-01" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("El nombre es requerido");
  });

  it("rejects an invalid date with 400", async () => {
    const res = await POST(
      makePost({ name: "Nuevo evento", date: "not-a-date" }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("La fecha no es válida");
  });

  it("deactivates existing events and creates the new one as active", async () => {
    const created = {
      id: "new-1",
      name: "Nuevo evento",
      date: "2026-12-01T00:00:00.000Z",
      active: true,
    };

    const txUpdateMany = vi.fn();
    const txCreate = vi.fn().mockResolvedValueOnce(created);
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) =>
      fn({ event: { updateMany: txUpdateMany, create: txCreate } }),
    );

    const res = await POST(
      makePost({ name: "Nuevo evento", date: "2026-12-01" }),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(created);
    expect(txUpdateMany).toHaveBeenCalledWith({
      where: { active: true },
      data: { active: false },
    });
    expect(txCreate).toHaveBeenCalledWith({
      data: {
        name: "Nuevo evento",
        date: new Date("2026-12-01"),
        active: true,
      },
    });
  });
});
