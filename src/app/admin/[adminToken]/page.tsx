import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, CircleCheck, ListChecks, Trophy } from "lucide-react";
import { loadTournamentByAdminToken, matchesToView } from "@/lib/tournamentData";
import { PlayerManager } from "./PlayerManager";
import { SettingsForm } from "./SettingsForm";
import { ActionButton, GenerateBracketForm } from "./AdminControls";
import { AdminMatchActions } from "./AdminMatchActions";
import { BracketView } from "@/components/BracketView";
import { PoolStandings } from "@/components/PoolStandings";
import { PoolMatchList } from "@/components/PoolMatchList";
import { CopyField } from "@/components/CopyField";
import { LiveRefresher } from "@/components/LiveRefresher";
import { RecordAdminVisit } from "@/components/RecordAdminVisit";
import { DeleteDivisionButton } from "@/components/DeleteDivisionButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addPlayer,
  addPlayersFromCsv,
  removePlayer,
  setPlayerSeed,
  randomizeSeeds,
  seedByRating,
  updateSettings,
  openCheckIn,
  adminToggleCheckIn,
  generateBracketAction,
  generatePlayoffAction,
  adminRecordScore,
  adminSetCourt,
  deleteDivision,
} from "./actions";

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

export default async function AdminPage({ params }: { params: Promise<{ adminToken: string }> }) {
  const { adminToken } = await params;
  const data = await loadTournamentByAdminToken(adminToken);
  if (!data) notFound();

  const { tournament, event, players, playerById, poolMatches, bracketMatches, poolStandings } = data;
  const bind = <T extends (id: string, token: string, ...rest: never[]) => Promise<void>>(fn: T) =>
    fn.bind(null, tournament.id, tournament.adminToken) as (...args: never[]) => Promise<void>;

  const checkedInCount = players.filter((p) => p.checkedIn).length;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const publicUrl = `${siteUrl}/t/${tournament.slug}`;

  const isPoolFormat = tournament.format === "ROUND_ROBIN" || tournament.format === "POOL_PLAY";
  const poolsComplete = poolMatches.length > 0 && poolMatches.every((m) => m.status === "COMPLETE");
  const playoffGenerated = bracketMatches.length > 0;
  const hasBracketContent = poolMatches.length > 0 || bracketMatches.length > 0;
  const status = STATUS_META[tournament.status];

  const recordScore = bind(adminRecordScore) as (fd: FormData) => Promise<void>;
  const setCourt = bind(adminSetCourt) as (fd: FormData) => Promise<void>;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <LiveRefresher />
      <RecordAdminVisit id={event.id} name={event.name} adminToken={event.adminToken} />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Admin dashboard
            {event.divisionCount > 1 && (
              <>
                {" · "}
                <Link href={`/admin/e/${event.adminToken}`} className="underline hover:text-foreground">
                  {event.name} ({event.divisionCount} brackets)
                </Link>
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{tournament.name}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{FORMAT_LABEL[tournament.format]}</p>
        </div>
        <div className="w-full max-w-sm sm:w-auto">
          <CopyField label="Share this with players" value={publicUrl || `/t/${tournament.slug}`} />
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            <Link href={`/t/${tournament.slug}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              View public page
              <ArrowUpRight className="size-3" />
            </Link>
            <Link href={`/admin/e/${event.adminToken}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              {event.divisionCount > 1 ? "Manage all brackets" : "Add another bracket"}
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {tournament.status === "DRAFT" && (
          <Alert>
            <ListChecks />
            <AlertTitle>Add your players, then open check-in</AlertTitle>
            <AlertDescription>Adjust the format below if needed — it locks once check-in opens.</AlertDescription>
            {players.length >= 2 && (
              <AlertAction>
                <ActionButton action={bind(openCheckIn) as () => Promise<void>}>Open check-in</ActionButton>
              </AlertAction>
            )}
          </Alert>
        )}

        {tournament.status === "CHECK_IN" && (
          <Alert>
            <CircleCheck />
            <AlertTitle>
              {checkedInCount}/{players.length} players checked in
            </AlertTitle>
            <AlertDescription>Generating the bracket locks in seeding — players can no longer be added or removed.</AlertDescription>
            <AlertAction>
              <GenerateBracketForm action={bind(generateBracketAction) as (fd: FormData) => Promise<void>} />
            </AlertAction>
          </Alert>
        )}

        {tournament.format === "POOL_PLAY" && !playoffGenerated && poolStandings.length > 0 && (
          <Alert>
            <Trophy />
            <AlertTitle>{poolsComplete ? "Pool play complete" : "Pool play in progress"}</AlertTitle>
            <AlertDescription>{poolsComplete ? "Ready to seed the playoff bracket from final standings." : "The playoff bracket can be generated once every pool match is final."}</AlertDescription>
            <AlertAction>
              <ActionButton action={bind(generatePlayoffAction) as () => Promise<void>}>Generate playoff bracket</ActionButton>
            </AlertAction>
          </Alert>
        )}

        {tournament.status === "DRAFT" && (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingsForm tournament={tournament} action={bind(updateSettings) as (fd: FormData) => Promise<void>} />
            </CardContent>
          </Card>
        )}

        <Tabs key={hasBracketContent ? "with-bracket" : "no-bracket"} defaultValue={hasBracketContent ? "bracket" : "players"}>
          <TabsList>
            <TabsTrigger value="players">Players ({players.length})</TabsTrigger>
            <TabsTrigger value="bracket" disabled={!hasBracketContent}>
              {tournament.format === "POOL_PLAY" || tournament.format === "ROUND_ROBIN" ? "Pools" : "Bracket"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="pt-4">
            <Card>
              <CardContent>
                <PlayerManager
                  players={players}
                  status={tournament.status}
                  addPlayer={bind(addPlayer) as (fd: FormData) => Promise<void>}
                  addPlayersFromCsv={bind(addPlayersFromCsv) as (fd: FormData) => Promise<void>}
                  removePlayer={bind(removePlayer) as (fd: FormData) => Promise<void>}
                  setPlayerSeed={bind(setPlayerSeed) as (fd: FormData) => Promise<void>}
                  randomizeSeeds={bind(randomizeSeeds) as () => Promise<void>}
                  seedByRating={bind(seedByRating) as () => Promise<void>}
                  adminToggleCheckIn={bind(adminToggleCheckIn) as (fd: FormData) => Promise<void>}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bracket" className="space-y-6 pt-4">
            {isPoolFormat && poolStandings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Standings</CardTitle>
                </CardHeader>
                <CardContent>
                  <PoolStandings pools={poolStandings} playerById={playerById} advancePerPool={tournament.format === "POOL_PLAY" ? tournament.advancePerPool : undefined} />
                </CardContent>
              </Card>
            )}

            {poolMatches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pool matches</CardTitle>
                </CardHeader>
                <CardContent>
                  <PoolMatchList
                    pools={data.pools}
                    matches={matchesToView(poolMatches, playerById)}
                    renderActions={(m) => <AdminMatchActions match={m} recordScore={recordScore} setCourt={setCourt} />}
                  />
                </CardContent>
              </Card>
            )}

            {bracketMatches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{tournament.format === "POOL_PLAY" ? "Playoff bracket" : "Bracket"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <BracketView
                    matches={matchesToView(bracketMatches, playerById)}
                    renderActions={(m) => <AdminMatchActions match={m} recordScore={recordScore} setCourt={setCourt} />}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Danger zone</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Permanently delete this bracket, its players, and all match results.</p>
            <DeleteDivisionButton name={tournament.name} action={bind(deleteDivision) as () => Promise<void>} redirectTo="/admin" variant="full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
