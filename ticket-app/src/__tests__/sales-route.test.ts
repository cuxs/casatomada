import { POST, GET } from "../app/api/sales/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    batch: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    sale: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    promoCode: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
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

    vi.mocked(prisma.batch.findFirst).mockResolvedValueOnce(null);

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

    vi.mocked(prisma.batch.findFirst).mockResolvedValueOnce(null);

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
});
