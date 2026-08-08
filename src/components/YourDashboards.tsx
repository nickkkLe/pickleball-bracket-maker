"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { X, LayoutDashboard } from "lucide-react";
import { subscribe, getSnapshot, getServerSnapshot, forgetEvent } from "@/lib/adminLinks";
import { Button } from "@/components/ui/button";

export function YourDashboards() {
  const events = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (events.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <LayoutDashboard className="size-3.5" />
        Your dashboards on this device
      </h2>
      <div className="space-y-1.5">
        {events.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <Link href={`/admin/e/${e.adminToken}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
              {e.name}
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => forgetEvent(e.id)}
              aria-label={`Remove ${e.name} from this list`}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">Remembered on this browser only — not synced anywhere.</p>
    </div>
  );
}
