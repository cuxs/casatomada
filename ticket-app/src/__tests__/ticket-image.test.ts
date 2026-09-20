import {
  copyTicketCard,
  renderTicketCard,
  type TicketCardData,
} from "@/lib/ticket-image";

// jsdom has no canvas implementation, so we record every drawing call on a
// fake 2D context and assert on what was drawn.
interface FakeContext {
  fillText: ReturnType<typeof vi.fn>;
  drawImage: ReturnType<typeof vi.fn>;
  roundRect: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  scale: ReturnType<typeof vi.fn>;
  measureText: ReturnType<typeof vi.fn>;
  fillStyle: string;
  font: string;
  letterSpacing: string;
  textAlign: string;
  textBaseline: string;
}

const ticket: TicketCardData = {
  qrDataUrl: "data:image/png;base64,mockqr",
  codeWord: "lombriz roja del monte",
  code: "A3F",
  entries: 1,
};

let ctx: FakeContext;
let toBlob: ReturnType<typeof vi.fn>;
let fakeBlob: Blob;

function drawnTexts(): string[] {
  return ctx.fillText.mock.calls.map((call) => call[0] as string);
}

beforeEach(() => {
  ctx = {
    fillText: vi.fn(),
    drawImage: vi.fn(),
    roundRect: vi.fn(),
    fillRect: vi.fn(),
    fill: vi.fn(),
    beginPath: vi.fn(),
    scale: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 7 })),
    fillStyle: "",
    font: "",
    letterSpacing: "",
    textAlign: "",
    textBaseline: "",
  };
  fakeBlob = new Blob(["png"], { type: "image/png" });
  toBlob = vi.fn((cb: (blob: Blob | null) => void) => cb(fakeBlob));

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => ctx as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
    toBlob as unknown as HTMLCanvasElement["toBlob"],
  );

  // jsdom never fires load on data-URL images; resolve immediately on src set.
  vi.spyOn(HTMLImageElement.prototype, "src", "set").mockImplementation(
    function (this: HTMLImageElement) {
      queueMicrotask(() => this.onload?.(new Event("load")));
    },
  );

  Object.defineProperty(document, "fonts", {
    value: { ready: Promise.resolve() },
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("renderTicketCard", () => {
  it("returns the PNG blob produced by the canvas", async () => {
    const blob = await renderTicketCard(ticket);

    expect(blob).toBe(fakeBlob);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/png");
  });

  it("renders at 2x scale with a fixed width", async () => {
    const createElement = vi.spyOn(document, "createElement");

    await renderTicketCard(ticket);

    const canvas = createElement.mock.results.find(
      (r) => r.value instanceof HTMLCanvasElement,
    )?.value as HTMLCanvasElement;
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBeGreaterThan(0);
    expect(ctx.scale).toHaveBeenCalledWith(2, 2);
  });

  it("draws the QR image", async () => {
    await renderTicketCard(ticket);

    expect(ctx.drawImage).toHaveBeenCalledTimes(1);
    const [img, , , w, h] = ctx.drawImage.mock.calls[0];
    expect(img).toBeInstanceOf(HTMLImageElement);
    expect(w).toBe(224);
    expect(h).toBe(224);
  });

  it("draws the animal (capitalized), the code and the entries pill", async () => {
    await renderTicketCard(ticket);

    const texts = drawnTexts();
    expect(texts).toContain("TU ANIMAL");
    expect(texts).toContain("Lombriz Roja Del Monte");
    expect(texts).toContain("TU CÓDIGO");
    expect(texts).toContain("A3F");
    expect(texts).toContain("Válido para ");
    expect(texts).toContain("1 entrada");
  });

  it("pluralizes entries", async () => {
    await renderTicketCard({ ...ticket, entries: 3 });

    expect(drawnTexts()).toContain("3 entradas");
  });

  it("omits the ticket label for single-QR sales", async () => {
    await renderTicketCard(ticket);

    expect(drawnTexts().some((t) => t.startsWith("ENTRADA "))).toBe(false);
  });

  it("includes the ticket label when given and grows the canvas", async () => {
    const createElement = vi.spyOn(document, "createElement");

    await renderTicketCard(ticket);
    const withoutLabel = createElement.mock.results.find(
      (r) => r.value instanceof HTMLCanvasElement,
    )?.value as HTMLCanvasElement;

    createElement.mockClear();
    await renderTicketCard({ ...ticket, label: "Entrada 2 de 3" });
    const withLabel = createElement.mock.results.find(
      (r) => r.value instanceof HTMLCanvasElement,
    )?.value as HTMLCanvasElement;

    expect(drawnTexts()).toContain("ENTRADA 2 DE 3");
    expect(withLabel.height).toBeGreaterThan(withoutLabel.height);
  });

  it("rejects when the QR image fails to load", async () => {
    vi.spyOn(HTMLImageElement.prototype, "src", "set").mockImplementation(
      function (this: HTMLImageElement) {
        queueMicrotask(() => this.onerror?.(new Event("error")));
      },
    );

    await expect(renderTicketCard(ticket)).rejects.toThrow(
      "No se pudo cargar el QR",
    );
  });

  it("rejects when the canvas cannot produce a blob", async () => {
    toBlob.mockImplementation((cb: (blob: Blob | null) => void) => cb(null));

    await expect(renderTicketCard(ticket)).rejects.toThrow(
      "No se pudo generar la imagen",
    );
  });
});

describe("copyTicketCard", () => {
  it("writes a PNG ClipboardItem to the clipboard", async () => {
    const write = vi.fn((_items: unknown[]) => Promise.resolve());
    const items: Record<string, unknown>[] = [];
    class FakeClipboardItem {
      constructor(data: Record<string, unknown>) {
        items.push(data);
      }
    }
    vi.stubGlobal("ClipboardItem", FakeClipboardItem);
    // setup.ts defines navigator.clipboard as writable, so we can assign it.
    Object.assign(navigator, { clipboard: { write } });

    await copyTicketCard(ticket);

    expect(write).toHaveBeenCalledTimes(1);
    expect(write.mock.calls[0][0][0]).toBeInstanceOf(FakeClipboardItem);
    expect(items).toHaveLength(1);
    // The blob is passed as a promise so Safari keeps the user gesture alive.
    expect(items[0]["image/png"]).toBeInstanceOf(Promise);
    await expect(items[0]["image/png"]).resolves.toBe(fakeBlob);

    vi.unstubAllGlobals();
  });

  it("throws a friendly error when the browser cannot copy images", async () => {
    vi.stubGlobal("ClipboardItem", undefined);
    Object.assign(navigator, { clipboard: { writeText: vi.fn() } });

    await expect(copyTicketCard(ticket)).rejects.toThrow(
      "Este navegador no permite copiar imágenes",
    );

    vi.unstubAllGlobals();
  });
});
