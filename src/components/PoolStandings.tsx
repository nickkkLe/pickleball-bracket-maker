import type { Player } from "@/generated/prisma/client";
import type { PoolStandingsData } from "@/lib/tournamentData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function PoolStandings({
  pools,
  playerById,
  advancePerPool,
  highlightPlayerId,
}: {
  pools: PoolStandingsData[];
  playerById: Map<string, Player>;
  advancePerPool?: number;
  highlightPlayerId?: string;
}) {
  if (pools.length === 0) return null;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {pools.map(({ pool, standings }) => (
        <div key={pool.id} className="overflow-hidden rounded-lg border border-border">
          <div className="border-b border-border bg-muted/40 px-3 py-2 text-sm font-semibold">{pool.name}</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 text-[11px] uppercase tracking-wide">Player</TableHead>
                <TableHead className="h-8 text-center text-[11px] uppercase tracking-wide">W-L</TableHead>
                <TableHead className="h-8 text-center text-[11px] uppercase tracking-wide">Diff</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((s, idx) => {
                const player = playerById.get(s.playerId);
                const advances = advancePerPool !== undefined && idx < advancePerPool;
                return (
                  <TableRow
                    key={s.playerId}
                    className={cn(advances && "bg-emerald-500/5", s.playerId === highlightPlayerId && "bg-primary/10")}
                  >
                    <TableCell className="py-1.5">
                      <span className="mr-1.5 text-[10px] text-muted-foreground">{idx + 1}</span>
                      {player?.name ?? "Unknown"}
                    </TableCell>
                    <TableCell className="py-1.5 text-center font-mono text-xs tabular-nums text-muted-foreground">
                      {s.wins}-{s.losses}
                    </TableCell>
                    <TableCell className="py-1.5 text-center font-mono text-xs tabular-nums text-muted-foreground">
                      {s.pointDiff > 0 ? `+${s.pointDiff}` : s.pointDiff}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
