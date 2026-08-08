import QRCode from "qrcode";

export async function getQrDataUrl(value: string, size = 400): Promise<string> {
  return QRCode.toDataURL(value, { width: size, margin: 1, color: { dark: "#000000", light: "#ffffff" } });
}
