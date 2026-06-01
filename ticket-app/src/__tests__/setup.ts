import "@testing-library/jest-dom";

// Mock navigator.clipboard since it is not defined in jsdom
if (typeof window !== "undefined") {
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: vi.fn(() => Promise.resolve()),
    },
    writable: true,
  });
}
