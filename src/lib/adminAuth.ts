export const ADMIN_AUTH_COOKIE = "pbb_admin_ok";

function getPasscode(): string {
  return process.env.ADMIN_PASSCODE || "pickleball";
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function expectedAdminCookieValue(): Promise<string> {
  return sha256Hex(getPasscode());
}

export function checkAdminPasscode(input: string): boolean {
  return input === getPasscode();
}
