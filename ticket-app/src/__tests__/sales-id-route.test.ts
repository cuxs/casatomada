import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PATCH } from "../app/api/sales/[id]/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sale: {
      update: vi.fn(),
    },
  },
}));

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/sales/abc-123", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/sales/[id]", () => {
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

    const req = makeRequest({ buyerName: "Nuevo Nombre" });
    const res = await PATCH(req, { params: { id: "abc-123" } });

    expect(res.status).toBe(401);
  });

  it("updates the buyer name", async () => {
    const updated = {
      id: "abc-123",
      buyerName: "Nuevo Nombre",
      ticketCount: 2,
    };
    vi.mocked(prisma.sale.update).mockResolvedValueOnce(updated as any);

    const req = makeRequest({ buyerName: "Nuevo Nombre" });
    const res = await PATCH(req, { params: { id: "abc-123" } });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(updated);
    expect(prisma.sale.update).toHaveBeenCalledWith({
      where: { id: "abc-123" },
      data: { buyerName: "Nuevo Nombre" },
    });
  });

  it("updates the ticket count", async () => {
    const updated = { id: "abc-123", buyerName: "Juan", ticketCount: 5 };
    vi.mocked(prisma.sale.update).mockResolvedValueOnce(updated as any);

    const req = makeRequest({ ticketCount: 5 });
    const res = await PATCH(req, { params: { id: "abc-123" } });

    expect(res.status).toBe(200);
    expect(prisma.sale.update).toHaveBeenCalledWith({
      where: { id: "abc-123" },
      data: { ticketCount: 5 },
    });
  });

  it("rejects an empty buyer name", async () => {
    const req = makeRequest({ buyerName: "   " });
    const res = await PATCH(req, { params: { id: "abc-123" } });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("El nombre es requerido");
    expect(prisma.sale.update).not.toHaveBeenCalled();
  });

  it("rejects an invalid ticket count", async () => {
    const req = makeRequest({ ticketCount: 0 });
    const res = await PATCH(req, { params: { id: "abc-123" } });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("La cantidad de entradas no es válida");
    expect(prisma.sale.update).not.toHaveBeenCalled();
  });

  it("rejects a request with no fields to update", async () => {
    const req = makeRequest({});
    const res = await PATCH(req, { params: { id: "abc-123" } });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No hay cambios para guardar");
  });

  it("updates the price", async () => {
    const updated = {
      id: "abc-123",
      buyerName: "Juan",
      ticketCount: 1,
      price: 0,
    };
    vi.mocked(prisma.sale.update).mockResolvedValueOnce(updated as any);

    const req = makeRequest({ price: 0 });
    const res = await PATCH(req, { params: { id: "abc-123" } });

    expect(res.status).toBe(200);
    expect(prisma.sale.update).toHaveBeenCalledWith({
      where: { id: "abc-123" },
      data: { price: 0 },
    });
  });

  it("rejects an invalid price", async () => {
    const req = makeRequest({ price: 9999 });
    const res = await PATCH(req, { params: { id: "abc-123" } });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("El precio no es válido");
    expect(prisma.sale.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the sale does not exist", async () => {
    vi.mocked(prisma.sale.update).mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.10.2",
      }),
    );

    const req = makeRequest({ buyerName: "Alguien" });
    const res = await PATCH(req, { params: { id: "missing-id" } });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Venta no encontrada");
  });
});
