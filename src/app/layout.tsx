import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { LogOut } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { ADMIN_AUTH_COOKIE, expectedAdminCookieValue } from "@/lib/adminAuth";
import { logoutAdmin } from "@/app/admin/actions";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pickleball Bracket Maker",
  description: "Create, seed, and run a pickleball tournament — players check in and enter scores themselves.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get(ADMIN_AUTH_COOKIE)?.value === (await expectedAdminCookieValue());

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {isAdmin && (
          <div className="flex justify-end border-b border-border px-4 py-2">
            <form action={logoutAdmin}>
              <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
                <LogOut className="size-3.5" />
                Log out
              </Button>
            </form>
          </div>
        )}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
