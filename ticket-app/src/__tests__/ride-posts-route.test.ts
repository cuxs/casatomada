import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "../app/api/ride-posts/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    ridePost: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

function makePost(body: unknown) {
  return new NextRequest("http://localhost:3000/api/ride-posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/ride-posts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all posts ordered by createdAt desc", async () => {
    const mockPosts = [
      {
        id: "1",
        authorName: "Juan",
        content: "Voy desde Palermo",
        phone: null,
        createdAt: "2026-06-30T00:00:00.000Z",
      },
    ];
    vi.mocked(prisma.ridePost.findMany).mockResolvedValueOnce(mockPosts as any);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(mockPosts);
    expect(prisma.ridePost.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns 500 when the db throws", async () => {
    vi.mocked(prisma.ridePost.findMany).mockRejectedValueOnce(
      new Error("db error"),
    );

    const res = await GET();

    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Error al obtener los posts");
  });
});

describe("POST /api/ride-posts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a post without phone and returns 201", async () => {
    const mockPost = {
      id: "abc",
      authorName: "Juan",
      content: "Voy desde Palermo",
      phone: null,
      createdAt: "2026-06-30T00:00:00.000Z",
    };
    vi.mocked(prisma.ridePost.create).mockResolvedValueOnce(mockPost as any);

    const res = await POST(
      makePost({ authorName: "Juan", content: "Voy desde Palermo" }),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(mockPost);
    expect(prisma.ridePost.create).toHaveBeenCalledWith({
      data: { authorName: "Juan", content: "Voy desde Palermo", phone: null },
    });
  });

  it("creates a post with phone and returns 201", async () => {
    const mockPost = {
      id: "abc",
      authorName: "Juan",
      content: "Voy desde Palermo",
      phone: "+54 9 11 1234-5678",
      createdAt: "2026-06-30T00:00:00.000Z",
    };
    vi.mocked(prisma.ridePost.create).mockResolvedValueOnce(mockPost as any);

    const res = await POST(
      makePost({
        authorName: "Juan",
        content: "Voy desde Palermo",
        phone: "+54 9 11 1234-5678",
      }),
    );

    expect(res.status).toBe(201);
    expect(prisma.ridePost.create).toHaveBeenCalledWith({
      data: {
        authorName: "Juan",
        content: "Voy desde Palermo",
        phone: "+54 9 11 1234-5678",
      },
    });
  });

  it("stores null when phone is empty string", async () => {
    vi.mocked(prisma.ridePost.create).mockResolvedValueOnce({ id: "1" } as any);

    await POST(makePost({ authorName: "Juan", content: "Hola", phone: "" }));

    expect(prisma.ridePost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ phone: null }),
      }),
    );
  });

  it("trims whitespace from fields", async () => {
    vi.mocked(prisma.ridePost.create).mockResolvedValueOnce({ id: "1" } as any);

    await POST(
      makePost({
        authorName: "  Juan  ",
        content: "  Hola  ",
        phone: "  123  ",
      }),
    );

    expect(prisma.ridePost.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { authorName: "Juan", content: "Hola", phone: "123" },
      }),
    );
  });

  it("rejects missing authorName with 400", async () => {
    const res = await POST(makePost({ content: "Hola" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("El nombre es requerido");
    expect(prisma.ridePost.create).not.toHaveBeenCalled();
  });

  it("rejects blank authorName with 400", async () => {
    const res = await POST(makePost({ authorName: "   ", content: "Hola" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("El nombre es requerido");
  });

  it("rejects missing content with 400", async () => {
    const res = await POST(makePost({ authorName: "Juan" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("El mensaje es requerido");
  });

  it("rejects authorName over 100 chars with 400", async () => {
    const res = await POST(
      makePost({ authorName: "a".repeat(101), content: "Hola" }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Nombre demasiado largo");
  });

  it("rejects content over 1000 chars with 400", async () => {
    const res = await POST(
      makePost({ authorName: "Juan", content: "x".repeat(1001) }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Mensaje demasiado largo");
  });

  it("rejects phone over 30 chars with 400", async () => {
    const res = await POST(
      makePost({ authorName: "Juan", content: "Hola", phone: "1".repeat(31) }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Número demasiado largo");
  });

  it("returns 400 when turnstile verification fails", async () => {
    const { verifyTurnstile } = await import("@/lib/turnstile");
    vi.mocked(verifyTurnstile).mockResolvedValueOnce(false);

    const res = await POST(
      makePost({ authorName: "Juan", content: "Hola", turnstileToken: "bad" }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(
      "Verificación de seguridad fallida. Intentá de nuevo.",
    );
    expect(prisma.ridePost.create).not.toHaveBeenCalled();
  });

  it("returns 500 when the db throws", async () => {
    vi.mocked(prisma.ridePost.create).mockRejectedValueOnce(
      new Error("db error"),
    );

    const res = await POST(makePost({ authorName: "Juan", content: "Hola" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Error al crear el post");
  });
});
