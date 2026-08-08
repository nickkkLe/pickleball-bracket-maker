import Link from "next/link";
import { ArrowUpRight, Settings2 } from "lucide-react";
import { loadEventByAdminToken } from "@/lib/eventData";
import { CopyField } from "@/components/CopyField";
import { QrCodeDialog } from "@/components/QrCodeDialog";
import { CreateTournamentForm } from "@/components/CreateTournamentForm";
import { RecordAdminVisit } from "@/components/RecordAdminVisit";
import { DeleteDivisionButton } from "@/components/DeleteDivisionButton";
import { NotAvailable } from "@/components/NotAvailable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createDivision } from "./actions";
import { deleteDivision } from "@/app/admin/[adminToken]/actions";
import { getQrDataUrl } from "@/lib/qrcode";
import { getSiteOrigin } from "@/lib/site";

const STATUS_META: Record<string, { label: string; variant: "outline" | "secondary" | "default" }> = {
  DRAFT: { label: "Draft", variant: "outline" },
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

export default async function EventAdminPage({ params }: { params: Promise<{ eventAdminToken: string }> }) {
  const { eventAdminToken } = await params;
  const data = await loadEventByAdminToken(eventAdminToken);
  if (!data) {
    return <NotAvailable title="This event isn't available" description="It may have been deleted, or the link is incorrect." />;
  }

  const siteUrl = await getSiteOrigin();
  const publicUrl = `${siteUrl}/e/${data.event.slug}`;
  const qrDataUrl = await getQrDataUrl(publicUrl);
  const action = createDivision.bind(null, data.event.id, eventAdminToken) as (formData: FormData) => Promise<void>;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <RecordAdminVisit id={data.event.id} name={data.event.name} adminToken={eventAdminToken} />
      <div className="mb-8">
        <p className="mb-1 text-xs font-medium text-muted-foreground">Event dashboard</p>
        <h1 className="text-2xl font-semibold tracking-tight">{data.event.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.divisions.length} {data.divisions.length === 1 ? "bracket" : "brackets"}
        </p>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-[auto_1fr]">
        <div className="flex justify-center sm:justify-start">
          <QrCodeDialog
            dataUrl={qrDataUrl}
            thumbnailSize={160}
            title={data.event.name}
            description="Players scan this to see all brackets in this event and check in."
          />
        </div>
        <div className="flex flex-col justify-center gap-2">
          <p className="text-sm text-muted-foreground">
            Print or display this QR code. Players scan it to see all brackets in this event{data.divisions.length <= 1 ? " (skips straight to the bracket while there's only one)" : ""} and check in.
          </p>
          <CopyField label="Public event link" value={publicUrl || `/e/${data.event.slug}`} />
        </div>
      </div>

      <div className="mb-8 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Brackets</h2>
        {data.divisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No brackets yet — add your first one below.</p>
        ) : (
          data.divisions.map((d) => {
            const status = STATUS_META[d.status];
            return (
              <Card key={d.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
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
                  <div className="flex items-center gap-3">
                    <Link href={`/t/${d.slug}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      Public page
                      <ArrowUpRight className="size-3" />
                    </Link>
                    <Link href={`/admin/${d.adminToken}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      <Settings2 className="size-3" />
                      Manage
                    </Link>
                    <DeleteDivisionButton name={d.name} action={deleteDivision.bind(null, d.id, d.adminToken) as () => Promise<void>} />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a bracket</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateTournamentForm
            action={action}
            nameLabel="Bracket name"
            namePlaceholder="Men's Doubles"
            submitLabel="Add bracket"
            idPrefix="division-"
          />
        </CardContent>
      </Card>
    </div>
  );
}
