import { verifyTurnstile } from "../lib/turnstile";

describe("verifyTurnstile", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    global.fetch = vi.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it("returns true without calling fetch when TURNSTILE_SECRET_KEY is not set", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;

    const result = await verifyTurnstile("any-token");

    expect(result).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns true when Cloudflare responds with success: true", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({ success: true }),
    } as any);

    const result = await verifyTurnstile("valid-token");

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ secret: "secret", response: "valid-token" }),
      }),
    );
  });

  it("returns false when Cloudflare responds with success: false", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({ success: false }),
    } as any);

    const result = await verifyTurnstile("bad-token");

    expect(result).toBe(false);
  });
});
