import QRCode from "qrcode";

export async function generateQrDataUrl(qrToken: string): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const qrUrl = `${appUrl}/check-qr?token=${qrToken}`;

  return QRCode.toDataURL(qrUrl, {
    width: 300,
    margin: 2,
    color: { dark: "#111827", light: "#ffffff" },
  });
}
