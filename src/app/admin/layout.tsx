import { cookies } from "next/headers";
import { LogOut } from "lucide-react";
import { ADMIN_AUTH_COOKIE, expectedAdminCookieValue } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { logoutAdmin } from "./actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get(ADMIN_AUTH_COOKIE)?.value === (await expectedAdminCookieValue());

  return (
    <div className="flex flex-1 flex-col">
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
    </div>
  );
}
