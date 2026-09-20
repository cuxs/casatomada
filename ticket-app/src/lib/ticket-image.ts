export interface TicketCardData {
  qrDataUrl: string;
  codeWord: string;
  code: string;
  entries: number;
  /** e.g. "Entrada 1 de 3"; omitted for single-ticket sales */
  label?: string;
}

const SCALE = 2;
const WIDTH = 400;
const PAD = 24;
const QR_SIZE = 224;
const GAP = 16;
const BOX_HEIGHT = 74;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo cargar el QR"));
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function capitalize(text: string) {
  return text
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Draws the ticket card (same layout as the on-screen one) and returns a PNG blob. */
export async function renderTicketCard(data: TicketCardData): Promise<Blob> {
  await document.fonts.ready;
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  const qr = await loadImage(data.qrDataUrl);

  const height =
    PAD +
    (data.label ? 16 + GAP : 0) +
    QR_SIZE +
    GAP +
    40 +
    GAP +
    BOX_HEIGHT +
    GAP +
    BOX_HEIGHT +
    PAD;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.scale(SCALE, SCALE);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Card
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, height);

  let y = PAD;

  if (data.label) {
    ctx.fillStyle = "#9ca3af";
    ctx.font = `600 12px ${font}`;
    ctx.letterSpacing = "1px";
    ctx.fillText(data.label.toUpperCase(), WIDTH / 2, y + 8);
    ctx.letterSpacing = "0px";
    y += 16 + GAP;
  }

  // QR
  ctx.drawImage(qr, (WIDTH - QR_SIZE) / 2, y, QR_SIZE, QR_SIZE);
  y += QR_SIZE + GAP;

  // "Válido para N entradas" pill
  const prefix = "Válido para ";
  const count = `${data.entries} ${data.entries === 1 ? "entrada" : "entradas"}`;
  ctx.font = `500 14px ${font}`;
  const prefixWidth = ctx.measureText(prefix).width;
  ctx.font = `700 14px ${font}`;
  const countWidth = ctx.measureText(count).width;
  const pillWidth = prefixWidth + countWidth + 32;
  const pillX = (WIDTH - pillWidth) / 2;
  ctx.fillStyle = "#f3f4f6";
  roundRect(ctx, pillX, y, pillWidth, 40, 20);
  ctx.fill();
  ctx.fillStyle = "#374151";
  ctx.textAlign = "left";
  ctx.font = `500 14px ${font}`;
  ctx.fillText(prefix, pillX + 16, y + 20);
  ctx.font = `700 14px ${font}`;
  ctx.fillText(count, pillX + 16 + prefixWidth, y + 20);
  ctx.textAlign = "center";
  y += 40 + GAP;

  // Dark boxes
  const drawBox = (title: string, value: string, spaced: boolean) => {
    ctx.fillStyle = "#111827";
    roundRect(ctx, PAD, y, WIDTH - PAD * 2, BOX_HEIGHT, 12);
    ctx.fill();
    ctx.fillStyle = "#d1d5db";
    ctx.font = `400 12px ${font}`;
    ctx.letterSpacing = "1px";
    ctx.fillText(title.toUpperCase(), WIDTH / 2, y + 22);
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 18px ${font}`;
    ctx.letterSpacing = spaced ? "3px" : "0px";
    ctx.fillText(value, WIDTH / 2, y + 48);
    ctx.letterSpacing = "0px";
    y += BOX_HEIGHT + GAP;
  };
  drawBox("Tu animal", capitalize(data.codeWord), false);
  drawBox("Tu código", data.code, true);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo generar la imagen"));
    }, "image/png");
  });
}

/**
 * Copies the rendered card to the clipboard. The blob is passed as a promise
 * so Safari keeps the user-gesture context while the image renders.
 */
export async function copyTicketCard(data: TicketCardData): Promise<void> {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    throw new Error("Este navegador no permite copiar imágenes");
  }
  await navigator.clipboard.write([
    new ClipboardItem({ "image/png": renderTicketCard(data) }),
  ]);
}
