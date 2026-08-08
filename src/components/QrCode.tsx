import QRCode from "qrcode";

export async function QrCode({ value, size = 200, className }: { value: string; size?: number; className?: string }) {
  const dataUrl = await QRCode.toDataURL(value, { width: size, margin: 1, color: { dark: "#000000", light: "#ffffff" } });
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt="QR code" width={size} height={size} className={className} />;
}
