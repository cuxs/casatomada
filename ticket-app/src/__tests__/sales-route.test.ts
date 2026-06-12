import { POST, GET } from "../app/api/sales/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

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
        "Authorization": `Basic ${badCreds}`,
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
        "Authorization": `Basic ${goodCreds}`,
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
        "Authorization": `Basic ${badCreds}`,
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
      { id: "1", buyerName: "Juan", ticketCount: 2, used: false, createdAt: "2026-05-29" }
    ];
    vi.mocked(prisma.sale.findMany).mockResolvedValueOnce(mockSales as any);

    const goodCreds = btoa("mariano:casa123tomada");
    const req = new NextRequest("http://localhost:3000/api/sales", {
      method: "GET",
      headers: {
        "Authorization": `Basic ${goodCreds}`,
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
      { id: "2", buyerName: "María", ticketCount: 1, used: true, createdAt: "2026-05-29" }
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
      { id: "1", buyerName: "Juan", ticketCount: 2, used: false, createdAt: "2026-05-29" },
    ];
    vi.mocked(prisma.sale.findMany).mockResolvedValueOnce(mockSales as any);
    vi.mocked(prisma.sale.count).mockResolvedValueOnce(15);
    vi.mocked(prisma.sale.aggregate).mockResolvedValueOnce({ _sum: { ticketCount: 22 } } as any);

    const req = new NextRequest("http://localhost:3000/api/sales?page=2&pageSize=10");
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
    vi.mocked(prisma.sale.aggregate).mockResolvedValueOnce({ _sum: { ticketCount: null } } as any);

    const req = new NextRequest("http://localhost:3000/api/sales?page=1&search=ana");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.totalTickets).toBe(0);

    const expectedWhere = { buyerName: { contains: "ana", mode: "insensitive" } };
    expect(prisma.sale.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expectedWhere })
    );
    expect(prisma.sale.count).toHaveBeenCalledWith({ where: expectedWhere });
  });
});
