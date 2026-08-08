"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_AUTH_COOKIE, checkAdminPasscode, expectedAdminCookieValue } from "@/lib/adminAuth";

export async function submitAdminPasscode(formData: FormData) {
  const passcode = String(formData.get("passcode") || "");
  const next = String(formData.get("next") || "/admin");

  if (!checkAdminPasscode(passcode)) {
    throw new Error("Incorrect passcode");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_AUTH_COOKIE, await expectedAdminCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(next);
}
