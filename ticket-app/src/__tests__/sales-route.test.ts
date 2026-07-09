import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "../app/api/sales/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sale: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

describe("POST and GET /api/sales - Auth protection", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // POST Protection tests
  it("blocks POST request with 401 if USER and PASSWORD are set but no auth header is present", async () => {
    process.env.USER = "mariano";
    process.env.PASSWORD = "casa123tomada";

    const req = new NextRequest("http://localhost:3000/api/sales", {
      method: "POST",
      body: JSON.stringify({ buyerName: "Test" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("blocks POST request with 401 if wrong credentials are sent", async () => {
    process.env.USER = "mariano";
    process.env.PASSWORD = "casa123tomada";

    const badCreds = btoa("wrong:creds");
    const req = new NextRequest("http://localhost:3000/api/sales", {
      method: "POST",
      headers: {
        Authorization: `Basic ${badCreds}`,
      },
      body: JSON.stringify({ buyerName: "Test" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("Credenciales incorrectas");
  });

  it("proceeds with normal POST flow if valid credentials are sent", async () => {
    process.env.USER = "mariano";
    process.env.PASSWORD = "casa123tomada";

    const goodCreds = btoa("mariano:casa123tomada");
    const req = new NextRequest("http://localhost:3000/api/sales", {
      method: "POST",
      headers: {
        Authorization: `Basic ${goodCreds}`,
      },
      body: JSON.stringify({ buyerName: "Test" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("bypasses POST auth checks if USER and PASSWORD are not set in environment", async () => {
    delete process.env.USER;
    delete process.env.PASSWORD;

    const req = new NextRequest("http://localhost:3000/api/sales", {
      method: "POST",
      body: JSON.stringify({ buyerName: "Test" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // GET Protection tests
  it("blocks GET request with 401 if USER and PASSWORD are set but no auth header is present", async () => {
    process.env.USER = "mariano";
    process.env.PASSWORD = "casa123tomada";

    const req = new NextRequest("http://localhost:3000/api/sales", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("No autorizado");
  });

  it("blocks GET request with 401 if wrong credentials are sent", async () => {
    process.env.USER = "mariano";
    process.env.PASSWORD = "casa123tomada";

    const badCreds = btoa("wrong:creds");
    const req = new NextRequest("http://localhost:3000/api/sales", {
      method: "GET",
      headers: {
        Authorization: `Basic ${badCreds}`,
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe("Credenciales incorrectas");
  });

  it("proceeds with normal GET flow if valid credentials are sent", async () => {
    process.env.USER = "mariano";
    process.env.PASSWORD = "casa123tomada";

    const mockSales = [
      {
        id: "1",
        buyerName: "Juan",
        ticketCount: 2,
        used: false,
        createdAt: "2026-05-29",
      },
    ];
    vi.mocked(prisma.sale.findMany).mockResolvedValueOnce(mockSales as any);

    const goodCreds = btoa("mariano:casa123tomada");
    const req = new NextRequest("http://localhost:3000/api/sales", {
      method: "GET",
      headers: {
        Authorization: `Basic ${goodCreds}`,
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockSales);
  });

  it("bypasses GET auth checks if USER and PASSWORD are not set in environment", async () => {
    delete process.env.USER;
    delete process.env.PASSWORD;

    const mockSales = [
      {
        id: "2",
        buyerName: "María",
        ticketCount: 1,
        used: true,
        createdAt: "2026-05-29",
      },
    ];
    vi.mocked(prisma.sale.findMany).mockResolvedValueOnce(mockSales as any);

    const req = new NextRequest("http://localhost:3000/api/sales", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockSales);
  });

  // Pagination and search
  it("returns a paginated response when 'page' is provided", async () => {
    delete process.env.USER;
    delete process.env.PASSWORD;

    const mockSales = [
      {
        id: "1",
        buyerName: "Juan",
        ticketCount: 2,
        used: false,
        createdAt: "2026-05-29",
      },
    ];
    vi.mocked(prisma.sale.findMany).mockResolvedValueOnce(mockSales as any);
    vi.mocked(prisma.sale.count).mockResolvedValueOnce(15);
    vi.mocked(prisma.sale.aggregate).mockResolvedValueOnce({
      _sum: { ticketCount: 22 },
    } as any);

    const req = new NextRequest(
      "http://localhost:3000/api/sales?page=2&pageSize=10",
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      sales: mockSales,
      total: 15,
      totalTickets: 22,
      page: 2,
      pageSize: 10,
      totalPages: 2,
    });

    expect(prisma.sale.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: "desc" },
      skip: 10,
      take: 10,
    });
    expect(prisma.sale.count).toHaveBeenCalledWith({ where: {} });
  });

  it("filters by buyerName (case-insensitive) when 'search' is provided", async () => {
    delete process.env.USER;
    delete process.env.PASSWORD;

    vi.mocked(prisma.sale.findMany).mockResolvedValueOnce([] as any);
    vi.mocked(prisma.sale.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.sale.aggregate).mockResolvedValueOnce({
      _sum: { ticketCount: null },
    } as any);

    const req = new NextRequest(
      "http://localhost:3000/api/sales?page=1&search=ana",
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.totalTickets).toBe(0);

    const expectedWhere = {
      buyerName: { contains: "ana", mode: "insensitive" },
    };
    expect(prisma.sale.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere }),
    );
    expect(prisma.sale.count).toHaveBeenCalledWith({ where: expectedWhere });
  });
});

describe("POST /api/sales - creating sales and distinct QRs", () => {
  const originalEnv = process.env;

  function makeRequest(body: unknown) {
    return new NextRequest("http://localhost:3000/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.USER;
    delete process.env.PASSWORD;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("creates a single sale when ticketCount is 1", async () => {
    vi.mocked(prisma.sale.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.sale.create).mockResolvedValueOnce({} as any);

    const res = await POST(
      makeRequest({ buyerName: "Juan", price: 10000, ticketCount: 1 }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ticketCount).toBe(1);
    expect(body.qrToken).toBeTruthy();
    expect(body.codeWord).toBeTruthy();
    expect(body.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(body.tickets).toBeUndefined();
    expect(prisma.sale.create).toHaveBeenCalledTimes(1);
    expect(prisma.sale.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        buyerName: "Juan",
        price: 10000,
        ticketCount: 1,
      }),
    });
  });

  it("keeps a single QR for the whole group when ticketCount > 1 and distinctQrs is not set", async () => {
    vi.mocked(prisma.sale.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.sale.create).mockResolvedValueOnce({} as any);

    const res = await POST(
      makeRequest({ buyerName: "Ana", price: 15000, ticketCount: 4 }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ticketCount).toBe(4);
    expect(body.tickets).toBeUndefined();
    expect(prisma.sale.create).toHaveBeenCalledTimes(1);
    expect(prisma.sale.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ticketCount: 4 }),
    });
  });

  it("ignores distinctQrs when ticketCount is 1", async () => {
    vi.mocked(prisma.sale.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.sale.create).mockResolvedValueOnce({} as any);

    const res = await POST(
      makeRequest({
        buyerName: "Solo",
        price: 10000,
        ticketCount: 1,
        distinctQrs: true,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tickets).toBeUndefined();
    expect(prisma.sale.create).toHaveBeenCalledTimes(1);
  });

  it("creates one sale per ticket, each valid for a single person, when distinctQrs is true", async () => {
    vi.mocked(prisma.sale.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.sale.create).mockResolvedValue({} as any);

    const res = await POST(
      makeRequest({
        buyerName: "Grupo",
        price: 13000,
        ticketCount: 3,
        distinctQrs: true,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.ticketCount).toBe(3);
    expect(body.qrToken).toBeUndefined();
    expect(body.tickets).toHaveLength(3);

    expect(prisma.sale.create).toHaveBeenCalledTimes(3);
    const calls = vi.mocked(prisma.sale.create).mock.calls;
    calls.forEach((call, index) => {
      expect((call[0] as any).data).toMatchObject({
        buyerName: `Grupo QR ${index + 1}`,
        price: 13000,
        ticketCount: 1,
      });
    });

    const qrTokens = body.tickets.map((t: { qrToken: string }) => t.qrToken);
    const codeWords = body.tickets.map((t: { codeWord: string }) => t.codeWord);
    expect(new Set(qrTokens).size).toBe(3);
    expect(new Set(codeWords).size).toBe(3);
    for (const ticket of body.tickets) {
      expect(ticket.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    }
  });

  it("retries with a new code word on a codeWord collision while generating distinct QRs", async () => {
    vi.mocked(prisma.sale.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.sale.create)
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
          code: "P2002",
          clientVersion: "5.10.2",
          meta: { target: ["codeWord"] },
        }),
      )
      .mockResolvedValue({} as any);

    const res = await POST(
      makeRequest({
        buyerName: "Grupo",
        price: 13000,
        ticketCount: 2,
        distinctQrs: true,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tickets).toHaveLength(2);
    expect(prisma.sale.create).toHaveBeenCalledTimes(3);

    const codeWords = body.tickets.map((t: { codeWord: string }) => t.codeWord);
    expect(new Set(codeWords).size).toBe(2);
  });

  it("returns 500 if a unique code word cannot be found", async () => {
    vi.mocked(prisma.sale.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.sale.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.10.2",
        meta: { target: ["codeWord"] },
      }),
    );

    const res = await POST(
      makeRequest({ buyerName: "Nadie", price: 10000, ticketCount: 1 }),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("No se pudo generar una palabra clave única");
  });
});
