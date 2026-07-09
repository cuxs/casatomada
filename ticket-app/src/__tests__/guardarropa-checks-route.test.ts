import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PATCH } from "../app/api/guardarropa/checks/[id]/route";
import { GET, POST } from "../app/api/guardarropa/checks/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    guardarropaCheck: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

function basicHeader(user: string, password: string) {
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
}

function makePostRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/guardarropa/checks", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function makePatchRequest(
  id: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return new NextRequest(`http://localhost:3000/api/guardarropa/checks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("guardarropa checks routes", () => {
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

  describe("POST /api/guardarropa/checks", () => {
    it("blocks the request with 401 if auth is configured but missing", async () => {
      process.env.GUARDARROPA_USER = "ropa";
      process.env.GUARDARROPA_PASSWORD = "ropapass";

      const res = await POST(makePostRequest({ saleId: "s1", itemCount: 1 }));

      expect(res.status).toBe(401);
    });

    it("accepts guardarropa credentials", async () => {
      process.env.GUARDARROPA_USER = "ropa";
      process.env.GUARDARROPA_PASSWORD = "ropapass";
      vi.mocked(prisma.guardarropaCheck.create).mockResolvedValueOnce(
        {} as any,
      );

      const res = await POST(
        makePostRequest(
          { saleId: "s1", itemCount: 1 },
          { authorization: basicHeader("ropa", "ropapass") },
        ),
      );

      expect(res.status).toBe(201);
    });

    it("accepts admin credentials", async () => {
      process.env.USER = "mariano";
      process.env.PASSWORD = "adminpass";
      vi.mocked(prisma.guardarropaCheck.create).mockResolvedValueOnce(
        {} as any,
      );

      const res = await POST(
        makePostRequest(
          { saleId: "s1", itemCount: 1 },
          { authorization: basicHeader("mariano", "adminpass") },
        ),
      );

      expect(res.status).toBe(201);
    });

    it("rejects a missing saleId", async () => {
      const res = await POST(makePostRequest({ itemCount: 1 }));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("El ticket es requerido");
      expect(prisma.guardarropaCheck.create).not.toHaveBeenCalled();
    });

    it.each([
      0,
      -1,
      1.5,
      100,
      "2",
    ])("rejects an invalid item count (%s)", async (itemCount) => {
      const res = await POST(makePostRequest({ saleId: "s1", itemCount }));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("La cantidad de objetos debe ser entre 1 y 99");
      expect(prisma.guardarropaCheck.create).not.toHaveBeenCalled();
    });

    it("creates a check with a trimmed description", async () => {
      const created = {
        id: "check-1",
        saleId: "s1",
        itemCount: 2,
        description: "campera negra",
        retrievedAt: null,
        sale: { codeWord: "capibara roja del monte", buyerName: "Juan" },
      };
      vi.mocked(prisma.guardarropaCheck.create).mockResolvedValueOnce(
        created as any,
      );

      const res = await POST(
        makePostRequest({
          saleId: "s1",
          itemCount: 2,
          description: "  campera negra  ",
        }),
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toEqual(created);
      expect(prisma.guardarropaCheck.create).toHaveBeenCalledWith({
        data: { saleId: "s1", itemCount: 2, description: "campera negra" },
        include: { sale: { select: { codeWord: true, buyerName: true } } },
      });
    });

    it("returns 404 when the sale does not exist", async () => {
      vi.mocked(prisma.guardarropaCheck.create).mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError("FK violation", {
          code: "P2003",
          clientVersion: "5.10.2",
        }),
      );

      const res = await POST(makePostRequest({ saleId: "nope", itemCount: 1 }));

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("No se encontró el ticket");
    });
  });

  describe("GET /api/guardarropa/checks", () => {
    it("requires a saleId", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/guardarropa/checks",
      );
      const res = await GET(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("El ticket es requerido");
    });

    it("returns active and already-retrieved deposits for the sale", async () => {
      const checks = [{ id: "check-1", itemCount: 2, retrievedAt: null }];
      const retrievedChecks = [
        { id: "check-2", itemCount: 1, retrievedAt: new Date().toISOString() },
      ];
      vi.mocked(prisma.guardarropaCheck.findMany)
        .mockResolvedValueOnce(checks as any)
        .mockResolvedValueOnce(retrievedChecks as any);

      const req = new NextRequest(
        "http://localhost:3000/api/guardarropa/checks?saleId=s1",
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.checks).toEqual(checks);
      expect(body.retrievedChecks).toEqual(retrievedChecks);
      expect(prisma.guardarropaCheck.findMany).toHaveBeenCalledWith({
        where: { saleId: "s1", retrievedAt: null },
        orderBy: { createdAt: "asc" },
      });
      expect(prisma.guardarropaCheck.findMany).toHaveBeenCalledWith({
        where: { saleId: "s1", retrievedAt: { not: null } },
        orderBy: { retrievedAt: "desc" },
      });
    });
  });

  describe("PATCH /api/guardarropa/checks/[id]", () => {
    it("rejects an unknown action", async () => {
      const res = await PATCH(makePatchRequest("check-1", { action: "otro" }), {
        params: { id: "check-1" },
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Acción no válida");
      expect(prisma.guardarropaCheck.updateMany).not.toHaveBeenCalled();
    });

    it("marks an active deposit as retrieved", async () => {
      const retrieved = {
        id: "check-1",
        itemCount: 2,
        retrievedAt: new Date().toISOString(),
      };
      vi.mocked(prisma.guardarropaCheck.updateMany).mockResolvedValueOnce({
        count: 1,
      });
      vi.mocked(prisma.guardarropaCheck.findUnique).mockResolvedValueOnce(
        retrieved as any,
      );

      const res = await PATCH(
        makePatchRequest("check-1", { action: "retrieve" }),
        { params: { id: "check-1" } },
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(retrieved);
      expect(prisma.guardarropaCheck.updateMany).toHaveBeenCalledWith({
        where: { id: "check-1", retrievedAt: null },
        data: { retrievedAt: expect.any(Date) },
      });
    });

    it("returns 409 when the deposit was already retrieved", async () => {
      vi.mocked(prisma.guardarropaCheck.updateMany).mockResolvedValueOnce({
        count: 0,
      });
      vi.mocked(prisma.guardarropaCheck.findUnique).mockResolvedValueOnce({
        id: "check-1",
        retrievedAt: new Date(),
      } as any);

      const res = await PATCH(
        makePatchRequest("check-1", { action: "retrieve" }),
        { params: { id: "check-1" } },
      );

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe("Este depósito ya fue retirado");
    });

    it("returns 404 when the deposit does not exist", async () => {
      vi.mocked(prisma.guardarropaCheck.updateMany).mockResolvedValueOnce({
        count: 0,
      });
      vi.mocked(prisma.guardarropaCheck.findUnique).mockResolvedValueOnce(null);

      const res = await PATCH(
        makePatchRequest("missing", { action: "retrieve" }),
        { params: { id: "missing" } },
      );

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("No se encontró el depósito");
    });
  });
});
