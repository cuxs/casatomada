import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { DELETE } from "../app/api/ride-posts/[id]/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    ridePost: {
      delete: vi.fn(),
    },
  },
}));

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost:3000/api/ride-posts/post-1", {
    method: "DELETE",
    headers,
  });
}

describe("DELETE /api/ride-posts/[id]", () => {
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

  it("returns 204 and deletes the post", async () => {
    vi.mocked(prisma.ridePost.delete).mockResolvedValueOnce({} as any);

    const res = await DELETE(makeRequest(), { params: { id: "post-1" } });

    expect(res.status).toBe(204);
    expect(prisma.ridePost.delete).toHaveBeenCalledWith({ where: { id: "post-1" } });
  });

  it("blocks request with 401 when auth is configured but missing", async () => {
    process.env.USER = "mariano";
    process.env.PASSWORD = "casa123tomada";

    const res = await DELETE(makeRequest(), { params: { id: "post-1" } });

    expect(res.status).toBe(401);
    expect(prisma.ridePost.delete).not.toHaveBeenCalled();
  });

  it("blocks request with 401 when wrong credentials are sent", async () => {
    process.env.USER = "mariano";
    process.env.PASSWORD = "casa123tomada";

    const res = await DELETE(
      makeRequest({ Authorization: `Basic ${btoa("wrong:creds")}` }),
      { params: { id: "post-1" } },
    );

    expect(res.status).toBe(401);
  });

  it("deletes when valid credentials are sent", async () => {
    process.env.USER = "mariano";
    process.env.PASSWORD = "casa123tomada";
    vi.mocked(prisma.ridePost.delete).mockResolvedValueOnce({} as any);

    const res = await DELETE(
      makeRequest({ Authorization: `Basic ${btoa("mariano:casa123tomada")}` }),
      { params: { id: "post-1" } },
    );

    expect(res.status).toBe(204);
  });

  it("returns 404 when post does not exist", async () => {
    vi.mocked(prisma.ridePost.delete).mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.22.0",
      }),
    );

    const res = await DELETE(makeRequest(), { params: { id: "missing" } });

    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Post no encontrado");
  });

  it("returns 500 on unexpected db error", async () => {
    vi.mocked(prisma.ridePost.delete).mockRejectedValueOnce(new Error("db error"));

    const res = await DELETE(makeRequest(), { params: { id: "post-1" } });

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Error al eliminar el post");
  });
});
