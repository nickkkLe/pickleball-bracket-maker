"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Shuffle, ArrowUpDown, X, Copy } from "lucide-react";
import type { Player } from "@/generated/prisma/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { reportActionError } from "@/lib/actionError";

type FormAction = (formData: FormData) => Promise<void>;
type PlainAction = () => Promise<void>;

function useSubmit() {
  const [pending, startTransition] = useTransition();
  const run = (action: FormAction | PlainAction, formData?: FormData) => {
    startTransition(async () => {
      try {
        await (formData ? (action as FormAction)(formData) : (action as PlainAction)());
      } catch (e) {
        reportActionError(e);
      }
    });
  };
  return { pending, run };
}

function PlayerRow({
  player,
  canEdit,
  setPlayerSeed,
  removePlayer,
  adminToggleCheckIn,
  showCheckIn,
  tournamentSlug,
}: {
  player: Player;
  canEdit: boolean;
  setPlayerSeed: FormAction;
  removePlayer: FormAction;
  adminToggleCheckIn: FormAction;
  showCheckIn: boolean;
  tournamentSlug: string;
}) {
  const { run } = useSubmit();

  return (
    <TableRow>
      <TableCell className="py-1.5">
        <Input
          key={player.seed}
          type="number"
          defaultValue={player.seed}
          disabled={!canEdit}
          min={1}
          className="h-7 w-14 text-center text-xs"
          onBlur={(e) => {
            const fd = new FormData();
            fd.set("playerId", player.id);
            fd.set("seed", e.currentTarget.value);
            run(setPlayerSeed, fd);
          }}
        />
      </TableCell>
      <TableCell className="py-1.5 font-medium">{player.name}</TableCell>
      <TableCell className="py-1.5 text-center text-xs text-muted-foreground">{player.rating ?? "—"}</TableCell>
      <TableCell className="py-1.5 text-center">
        <button
          type="button"
          onClick={async () => {
            const url = `${window.location.origin}/t/${tournamentSlug}/p/${player.code}`;
            await navigator.clipboard.writeText(url);
            toast.success(`Copied ${player.name}'s check-in link`);
          }}
          className="inline-flex items-center gap-1 font-mono text-xs text-foreground hover:underline"
          title={`Copy ${player.name}'s check-in link, in case they lost it`}
        >
          {player.code}
          <Copy className="size-3 text-muted-foreground" />
        </button>
      </TableCell>
      {showCheckIn && (
        <TableCell className="py-1.5 text-center">
          <Badge
            variant={player.checkedIn ? "secondary" : "outline"}
            className="cursor-pointer text-[10px]"
            onClick={() => {
              const fd = new FormData();
              fd.set("playerId", player.id);
              run(adminToggleCheckIn, fd);
            }}
            title={player.checkedIn && player.checkedInAt ? `Checked in ${new Date(player.checkedInAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Click to check in manually"}
          >
            {player.checkedIn ? "Checked in" : "Not yet"}
          </Badge>
        </TableCell>
      )}
      <TableCell className="py-1.5 text-right">
        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => {
              const fd = new FormData();
              fd.set("playerId", player.id);
              run(removePlayer, fd);
            }}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function PlayerManager({
  players,
  status,
  tournamentSlug,
  addPlayer,
  addPlayersFromCsv,
  removePlayer,
  setPlayerSeed,
  randomizeSeeds,
  seedByRating,
  adminToggleCheckIn,
}: {
  players: Player[];
  status: string;
  tournamentSlug: string;
  addPlayer: FormAction;
  addPlayersFromCsv: FormAction;
  removePlayer: FormAction;
  setPlayerSeed: FormAction;
  randomizeSeeds: PlainAction;
  seedByRating: PlainAction;
  adminToggleCheckIn: FormAction;
}) {
  const canEdit = status === "DRAFT" || status === "CHECK_IN";
  const showCheckIn = status !== "DRAFT";
  const { pending, run } = useSubmit();
  const addFormRef = useRef<HTMLFormElement>(null);
  const csvFormRef = useRef<HTMLFormElement>(null);

  const sorted = [...players].sort((a, b) => a.seed - b.seed);
  const hasRatings = players.some((p) => p.rating !== null);

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="grid gap-4 sm:grid-cols-2">
          <form
            ref={addFormRef}
            action={(fd) => {
              run(addPlayer, fd);
              addFormRef.current?.reset();
            }}
            className="space-y-2 rounded-lg border border-border p-3"
          >
            <div className="text-xs font-medium text-muted-foreground">Add a player</div>
            <div className="flex gap-2">
              <Input name="name" placeholder="Name" required className="h-8 min-w-0 flex-1" />
              <Input name="rating" placeholder="Rating" type="number" step="0.01" className="h-8 w-20" />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="w-full">
              Add player
            </Button>
          </form>

          <form
            ref={csvFormRef}
            action={(fd) => {
              run(addPlayersFromCsv, fd);
              csvFormRef.current?.reset();
            }}
            className="space-y-2 rounded-lg border border-border p-3"
          >
            <div className="text-xs font-medium text-muted-foreground">Bulk import (CSV: name, rating)</div>
            <Textarea name="csv" rows={3} placeholder={"Jordan Lee, 4.5\nSam Rivera, 4.0\nCasey Kim"} className="min-h-0 resize-none font-mono text-xs" />
            <Button type="submit" variant="secondary" size="sm" className="w-full">
              Import players
            </Button>
          </form>
        </div>
      )}

      {canEdit && players.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => run(randomizeSeeds)}>
            <Shuffle className="size-3.5" />
            Randomize seeding
          </Button>
          {hasRatings && (
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => run(seedByRating)}>
              <ArrowUpDown className="size-3.5" />
              Seed by rating
            </Button>
          )}
        </div>
      )}

      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">No players yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 text-[11px] uppercase">Seed</TableHead>
                <TableHead className="h-8 text-[11px] uppercase">Name</TableHead>
                <TableHead className="h-8 text-center text-[11px] uppercase">Rating</TableHead>
                <TableHead className="h-8 text-center text-[11px] uppercase">Code</TableHead>
                {showCheckIn && <TableHead className="h-8 text-center text-[11px] uppercase">Check-in</TableHead>}
                <TableHead className="h-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((p) => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  canEdit={canEdit}
                  setPlayerSeed={setPlayerSeed}
                  removePlayer={removePlayer}
                  adminToggleCheckIn={adminToggleCheckIn}
                  showCheckIn={showCheckIn}
                  tournamentSlug={tournamentSlug}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
