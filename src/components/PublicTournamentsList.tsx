import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { PublicEventData } from "@/lib/eventData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_META: Record<string, { label: string; variant: "outline" | "secondary" | "default" }> = {
  DRAFT: { label: "Not started", variant: "outline" },
  CHECK_IN: { label: "Check-in open", variant: "secondary" },
  IN_PROGRESS: { label: "In progress", variant: "default" },
  COMPLETE: { label: "Complete", variant: "secondary" },
};

const FORMAT_LABEL: Record<string, string> = {
  SINGLE_ELIM: "Single elimination",
  DOUBLE_ELIM: "Double elimination",
  ROUND_ROBIN: "Round robin",
  POOL_PLAY: "Pool play + bracket",
};

/** Public, read-only listing — no admin tokens or management links here. */
export function PublicTournamentsList({ events }: { events: PublicEventData[] }) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">No tournaments yet — check back soon.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map(({ event, divisions }) => (
        <Card key={event.id}>
          <CardHeader>
            <CardTitle className="text-lg">{event.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {divisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No brackets yet in this event.</p>
            ) : (
              divisions.map((d) => {
                const status = STATUS_META[d.status];
                return (
                  <Link
                    key={d.id}
                    href={`/t/${d.slug}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 transition-colors hover:bg-accent/50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{d.name}</span>
                        <Badge variant={status.variant} className="text-[10px]">
                          {status.label}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {FORMAT_LABEL[d.format]}
                        {d.playerCount > 0 && ` · ${d.checkedInCount}/${d.playerCount} checked in`}
                      </p>
                    </div>
                    <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
