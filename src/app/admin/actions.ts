"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_AUTH_COOKIE } from "@/lib/adminAuth";

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_AUTH_COOKIE);
  redirect("/");
}
