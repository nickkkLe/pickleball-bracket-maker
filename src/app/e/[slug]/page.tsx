import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { loadEventBySlug } from "@/lib/eventData";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadEventBySlug(slug);
  if (!data) notFound();

  if (data.divisions.length === 1) {
    redirect(`/t/${data.divisions[0].slug}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-14">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{data.event.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.divisions.length === 0 ? "No brackets yet" : "Choose which bracket you're playing in"}
        </p>
      </div>

      {data.divisions.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">The organizer hasn&apos;t set up any brackets yet — check back soon.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.divisions.map((d) => {
            const status = STATUS_META[d.status];
            return (
              <Link key={d.id} href={`/t/${d.slug}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{d.name}</CardTitle>
                        <Badge variant={status.variant} className="text-[10px]">
                          {status.label}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {FORMAT_LABEL[d.format]}
                        {d.playerCount > 0 && ` · ${d.checkedInCount}/${d.playerCount} checked in`}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
