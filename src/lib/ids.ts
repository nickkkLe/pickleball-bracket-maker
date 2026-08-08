import { customAlphabet, nanoid } from "nanoid";

const codeAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);
const slugAlphabet = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 6);

export function newId(): string {
  return nanoid();
}

export function newPlayerCode(): string {
  return codeAlphabet();
}

export function newAdminToken(): string {
  return nanoid(28);
}

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "tournament";
}

export function newSlug(name: string): string {
  return `${slugify(name)}-${slugAlphabet()}`;
}
