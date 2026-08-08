import { User, Shield, Cog } from "lucide-react";
import type { AuditLogEntry } from "@/generated/prisma/client";

const ACTOR_META: Record<string, { label: string; icon: typeof User }> = {
  admin: { label: "Admin", icon: Shield },
  player: { label: "Player", icon: User },
  system: { label: "System", icon: Cog },
};

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function AuditLog({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {entries.map((entry) => {
        const meta = ACTOR_META[entry.actor] ?? ACTOR_META.system;
        const Icon = meta.icon;
        return (
          <li key={entry.id} className="flex items-start gap-2.5 text-sm">
            <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-foreground">{entry.message}</p>
              <p className="text-xs text-muted-foreground">
                {meta.label} · {formatTimestamp(entry.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
