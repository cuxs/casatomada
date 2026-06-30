import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { POST } from "../app/api/ride-posts/[id]/comments/route";
import { DELETE } from "../app/api/ride-posts/[id]/comments/[commentId]/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    rideComment: {
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/ride-posts/post-1/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(headers: Record<string, string> = {}) {
  return new NextRequest(
    "http://localhost:3000/api/ride-posts/post-1/comments/comment-1",
    { method: "DELETE", headers },
  );
}

describe("POST /api/ride-posts/[id]/comments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a comment and returns 201", async () => {
    const mockComment = {
      id: "comment-1",
      postId: "post-1",
      authorName: "María",
      content: "Gracias!",
      createdAt: "2026-06-30T00:00:00.000Z",
    };
    vi.mocked(prisma.rideComment.create).mockResolvedValueOnce(mockComment as any);

    const res = await POST(makePostRequest({ authorName: "María", content: "Gracias!" }), {
      params: { id: "post-1" },
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(mockComment);
    expect(prisma.rideComment.create).toHaveBeenCalledWith({
      data: { postId: "post-1", authorName: "María", content: "Gracias!" },
    });
  });

  it("trims whitespace from fields", async () => {
    vi.mocked(prisma.rideComment.create).mockResolvedValueOnce({ id: "1" } as any);

    await POST(makePostRequest({ authorName: "  María  ", content: "  Hola  " }), {
      params: { id: "post-1" },
    });

    expect(prisma.rideComment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { postId: "post-1", authorName: "María", content: "Hola" } }),
    );
  });

  it("rejects missing authorName with 400", async () => {
    const res = await POST(makePostRequest({ content: "Hola" }), { params: { id: "post-1" } });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("El nombre es requerido");
  });

  it("rejects blank authorName with 400", async () => {
    const res = await POST(makePostRequest({ authorName: "  ", content: "Hola" }), {
      params: { id: "post-1" },
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("El nombre es requerido");
  });

  it("rejects missing content with 400", async () => {
    const res = await POST(makePostRequest({ authorName: "María" }), { params: { id: "post-1" } });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("El mensaje es requerido");
  });

  it("rejects authorName over 100 chars with 400", async () => {
    const res = await POST(
      makePostRequest({ authorName: "a".repeat(101), content: "Hola" }),
      { params: { id: "post-1" } },
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Nombre demasiado largo");
  });

  it("rejects content over 500 chars with 400", async () => {
    const res = await POST(
      makePostRequest({ authorName: "María", content: "x".repeat(501) }),
      { params: { id: "post-1" } },
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Mensaje demasiado largo");
  });

  it("returns 400 when turnstile verification fails", async () => {
    const { verifyTurnstile } = await import("@/lib/turnstile");
    vi.mocked(verifyTurnstile).mockResolvedValueOnce(false);

    const res = await POST(
      makePostRequest({ authorName: "María", content: "Hola", turnstileToken: "bad" }),
      { params: { id: "post-1" } },
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Verificación de seguridad fallida. Intentá de nuevo.");
    expect(prisma.rideComment.create).not.toHaveBeenCalled();
  });

  it("returns 404 when the post does not exist (P2003)", async () => {
    vi.mocked(prisma.rideComment.create).mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Foreign key constraint", {
        code: "P2003",
        clientVersion: "5.22.0",
      }),
    );

    const res = await POST(makePostRequest({ authorName: "María", content: "Hola" }), {
      params: { id: "missing-post" },
    });
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Post no encontrado");
  });

  it("returns 500 on unexpected db error", async () => {
    vi.mocked(prisma.rideComment.create).mockRejectedValueOnce(new Error("db error"));

    const res = await POST(makePostRequest({ authorName: "María", content: "Hola" }), {
      params: { id: "post-1" },
    });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Error al crear el comentario");
  });
});

describe("DELETE /api/ride-posts/[id]/comments/[commentId]", () => {
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

  it("returns 204 and deletes the comment", async () => {
    vi.mocked(prisma.rideComment.delete).mockResolvedValueOnce({} as any);

    const res = await DELETE(makeDeleteRequest(), {
      params: { id: "post-1", commentId: "comment-1" },
    });

    expect(res.status).toBe(204);
    expect(prisma.rideComment.delete).toHaveBeenCalledWith({ where: { id: "comment-1" } });
  });

  it("blocks request with 401 when auth is configured but missing", async () => {
    process.env.USER = "mariano";
    process.env.PASSWORD = "casa123tomada";

    const res = await DELETE(makeDeleteRequest(), {
      params: { id: "post-1", commentId: "comment-1" },
    });

    expect(res.status).toBe(401);
    expect(prisma.rideComment.delete).not.toHaveBeenCalled();
  });

  it("deletes when valid credentials are sent", async () => {
    process.env.USER = "mariano";
    process.env.PASSWORD = "casa123tomada";
    vi.mocked(prisma.rideComment.delete).mockResolvedValueOnce({} as any);

    const res = await DELETE(
      makeDeleteRequest({ Authorization: `Basic ${btoa("mariano:casa123tomada")}` }),
      { params: { id: "post-1", commentId: "comment-1" } },
    );

    expect(res.status).toBe(204);
  });

  it("returns 404 when comment does not exist", async () => {
    vi.mocked(prisma.rideComment.delete).mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "5.22.0",
      }),
    );

    const res = await DELETE(makeDeleteRequest(), {
      params: { id: "post-1", commentId: "missing" },
    });

    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Comentario no encontrado");
  });

  it("returns 500 on unexpected db error", async () => {
    vi.mocked(prisma.rideComment.delete).mockRejectedValueOnce(new Error("db error"));

    const res = await DELETE(makeDeleteRequest(), {
      params: { id: "post-1", commentId: "comment-1" },
    });

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Error al eliminar el comentario");
  });
});
