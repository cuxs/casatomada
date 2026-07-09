import { isAuthConfigured, isAuthorized } from "@/lib/basic-auth";

function basicHeader(user: string, password: string) {
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
}

describe("basic auth scopes", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.USER;
    delete process.env.PASSWORD;
    delete process.env.GUARDARROPA_USER;
    delete process.env.GUARDARROPA_PASSWORD;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function configureAdmin() {
    process.env.USER = "mariano";
    process.env.PASSWORD = "adminpass";
  }

  function configureGuardarropa() {
    process.env.GUARDARROPA_USER = "ropa";
    process.env.GUARDARROPA_PASSWORD = "ropapass";
  }

  describe("isAuthConfigured", () => {
    it("is unconfigured for both scopes with no env vars", () => {
      expect(isAuthConfigured()).toBe(false);
      expect(isAuthConfigured("guardarropa")).toBe(false);
    });

    it("admin creds configure both scopes", () => {
      configureAdmin();
      expect(isAuthConfigured("admin")).toBe(true);
      expect(isAuthConfigured("guardarropa")).toBe(true);
    });

    it("guardarropa creds configure only the guardarropa scope", () => {
      configureGuardarropa();
      expect(isAuthConfigured("admin")).toBe(false);
      expect(isAuthConfigured("guardarropa")).toBe(true);
    });

    it("ignores a guardarropa pair with only one env var set", () => {
      process.env.GUARDARROPA_USER = "ropa";
      expect(isAuthConfigured("guardarropa")).toBe(false);
    });
  });

  describe("isAuthorized", () => {
    beforeEach(() => {
      configureAdmin();
      configureGuardarropa();
    });

    it("accepts admin creds on the admin scope", () => {
      expect(isAuthorized(basicHeader("mariano", "adminpass"), "admin")).toBe(
        true,
      );
    });

    it("accepts admin creds on the guardarropa scope", () => {
      expect(
        isAuthorized(basicHeader("mariano", "adminpass"), "guardarropa"),
      ).toBe(true);
    });

    it("accepts guardarropa creds on the guardarropa scope", () => {
      expect(isAuthorized(basicHeader("ropa", "ropapass"), "guardarropa")).toBe(
        true,
      );
    });

    it("rejects guardarropa creds on the admin scope", () => {
      expect(isAuthorized(basicHeader("ropa", "ropapass"), "admin")).toBe(
        false,
      );
    });

    it("rejects wrong creds on both scopes", () => {
      expect(isAuthorized(basicHeader("nadie", "nada"), "admin")).toBe(false);
      expect(isAuthorized(basicHeader("nadie", "nada"), "guardarropa")).toBe(
        false,
      );
    });

    it("rejects a missing header", () => {
      expect(isAuthorized(null, "admin")).toBe(false);
      expect(isAuthorized(null, "guardarropa")).toBe(false);
    });

    it("defaults to the admin scope", () => {
      expect(isAuthorized(basicHeader("mariano", "adminpass"))).toBe(true);
      expect(isAuthorized(basicHeader("ropa", "ropapass"))).toBe(false);
    });
  });
});
