import type { ReactNode } from "react";
import type { MatchView } from "@/lib/tournamentData";
import type { Pool } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PoolMatchList({
  pools,
  matches,
  renderActions,
  highlightPlayerId,
}: {
  pools: Pool[];
  matches: MatchView[];
  renderActions?: (m: MatchView) => ReactNode;
  highlightPlayerId?: string;
}) {
  if (matches.length === 0) return null;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {pools.map((pool) => {
        const poolMatches = matches.filter((m) => m.poolId === pool.id).sort((a, b) => a.round - b.round || a.position - b.position);
        if (poolMatches.length === 0) return null;
        return (
          <div key={pool.id} className="space-y-2">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{pool.name}</h3>
            <div className="space-y-2">
              {poolMatches.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "rounded-lg border bg-card p-3",
                    m.player1?.id === highlightPlayerId || m.player2?.id === highlightPlayerId ? "border-primary ring-1 ring-primary/30" : "border-border"
                  )}
                >
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Round {m.round}</span>
                    <Badge variant={m.status === "COMPLETE" ? "secondary" : "outline"} className="text-[10px]">
                      {m.status === "COMPLETE" ? "Final" : "Not played"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={m.winnerId === m.player1?.id ? "font-semibold text-foreground" : "text-muted-foreground"}>
                      {m.player1?.name ?? "—"}
                      {m.player1Score !== null && <span className="ml-2 font-mono text-xs tabular-nums">{m.player1Score}</span>}
                    </span>
                    <span className="px-2 text-xs text-muted-foreground">vs</span>
                    <span className={m.winnerId === m.player2?.id ? "font-semibold text-foreground" : "text-muted-foreground"}>
                      {m.player2Score !== null && <span className="mr-2 font-mono text-xs tabular-nums">{m.player2Score}</span>}
                      {m.player2?.name ?? "—"}
                    </span>
                  </div>
                  {renderActions && <div className="mt-2">{renderActions(m)}</div>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
