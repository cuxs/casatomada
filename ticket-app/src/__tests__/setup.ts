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

// jsdom doesn't implement ResizeObserver or scrollIntoView, which cmdk (the
// event switcher's command palette) needs on mount.
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
