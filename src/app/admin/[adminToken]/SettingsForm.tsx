"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Tournament } from "@/generated/prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { reportActionError } from "@/lib/actionError";

const FORMATS = [
  { value: "SINGLE_ELIM", label: "Single elimination" },
  { value: "DOUBLE_ELIM", label: "Double elimination" },
  { value: "ROUND_ROBIN", label: "Round robin" },
  { value: "POOL_PLAY", label: "Pool play + bracket" },
] as const;

export function SettingsForm({ tournament, action }: { tournament: Tournament; action: (formData: FormData) => Promise<void> }) {
  const [format, setFormat] = useState<string>(tournament.format);
  const [pending, startTransition] = useTransition();
  const showPools = format === "ROUND_ROBIN" || format === "POOL_PLAY";
  const showPlayoff = format === "POOL_PLAY";

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          try {
            await action(fd);
            toast.success("Settings saved");
          } catch (e) {
            reportActionError(e);
          }
        });
      }}
      className="space-y-4"
    >
      <input type="hidden" name="format" value={format} />
      <div className="space-y-1.5">
        <Label htmlFor="settings-name">Name</Label>
        <Input id="settings-name" name="name" defaultValue={tournament.name} required className="h-9" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="settings-format">Format</Label>
        <Select value={format} onValueChange={(v) => v && setFormat(v)}>
          <SelectTrigger id="settings-format" className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMATS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showPools && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="poolCount">Number of pools</Label>
            <Input id="poolCount" name="poolCount" type="number" min={1} max={32} defaultValue={tournament.poolCount} className="h-9" />
          </div>
          {showPlayoff && (
            <div className="space-y-1.5">
              <Label htmlFor="advancePerPool">Advance per pool</Label>
              <Input id="advancePerPool" name="advancePerPool" type="number" min={1} max={8} defaultValue={tournament.advancePerPool} className="h-9" />
            </div>
          )}
        </div>
      )}

      {showPlayoff && (
        <div className="space-y-1.5">
          <Label htmlFor="playoffFormat">Playoff bracket format</Label>
          <Select name="playoffFormat" defaultValue={tournament.playoffFormat}>
            <SelectTrigger id="playoffFormat" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE_ELIM">Single elimination</SelectItem>
              <SelectItem value="DOUBLE_ELIM">Double elimination</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="pointsToWin">Points to win</Label>
          <Input id="pointsToWin" name="pointsToWin" type="number" min={1} max={99} defaultValue={tournament.pointsToWin} className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gamesPerMatch">Games per match</Label>
          <Input id="gamesPerMatch" name="gamesPerMatch" type="number" min={1} max={5} defaultValue={tournament.gamesPerMatch} className="h-9" />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch id="winByTwo" name="winByTwo" defaultChecked={tournament.winByTwo} />
          <Label htmlFor="winByTwo">Win by two</Label>
        </div>
      </div>

      <Button type="submit" disabled={pending} variant="secondary">
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
