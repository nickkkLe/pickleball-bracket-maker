"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Swords, Users, Trophy, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const FORMATS = [
  { value: "SINGLE_ELIM", label: "Single elimination", blurb: "Classic knockout. Lose once, you're out.", icon: Swords },
  { value: "DOUBLE_ELIM", label: "Double elimination", blurb: "Drop to the losers bracket after one loss.", icon: Layers },
  { value: "ROUND_ROBIN", label: "Round robin", blurb: "Everyone plays everyone, ranked by record.", icon: Users },
  { value: "POOL_PLAY", label: "Pool play + bracket", blurb: "Pools first, then top finishers play a bracket.", icon: Trophy },
] as const;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full">
      {pending ? "Creating…" : label}
    </Button>
  );
}

export function CreateTournamentForm({
  action,
  nameLabel = "Tournament name",
  namePlaceholder = "Saturday Morning Smash",
  submitLabel = "Create tournament",
  idPrefix = "",
}: {
  action: (formData: FormData) => Promise<void>;
  nameLabel?: string;
  namePlaceholder?: string;
  submitLabel?: string;
  idPrefix?: string;
}) {
  const [format, setFormat] = useState<(typeof FORMATS)[number]["value"]>("SINGLE_ELIM");
  const showPools = format === "ROUND_ROBIN" || format === "POOL_PLAY";
  const showPlayoff = format === "POOL_PLAY";

  return (
    <form action={action} className="space-y-7">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}name`}>{nameLabel}</Label>
        <Input id={`${idPrefix}name`} name="name" required placeholder={namePlaceholder} className="h-10" />
      </div>

      <div className="space-y-1.5">
        <Label>Format</Label>
        <RadioGroup value={format} onValueChange={(v) => setFormat(v as typeof format)} name="format" className="grid gap-2 sm:grid-cols-2">
          {FORMATS.map((f) => {
            const Icon = f.icon;
            const active = format === f.value;
            return (
              <label
                key={f.value}
                htmlFor={f.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                  active ? "border-primary bg-accent" : "border-border hover:bg-accent/50"
                )}
              >
                <Icon className={cn("mt-0.5 size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                <div className="flex-1 space-y-0.5">
                  <div className="text-sm font-medium leading-none">{f.label}</div>
                  <p className="text-xs text-muted-foreground">{f.blurb}</p>
                </div>
                <RadioGroupItem value={f.value} id={f.value} className="mt-0.5" />
              </label>
            );
          })}
        </RadioGroup>
      </div>

      {showPools && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="poolCount">Number of pools</Label>
            <Input id="poolCount" name="poolCount" type="number" min={1} max={32} defaultValue={2} className="h-10" />
            <p className="text-xs text-muted-foreground">Players split evenly across pools. Use 1 for everyone-plays-everyone.</p>
          </div>
          {showPlayoff && (
            <div className="space-y-1.5">
              <Label htmlFor="advancePerPool">Advance per pool</Label>
              <Input id="advancePerPool" name="advancePerPool" type="number" min={1} max={8} defaultValue={2} className="h-10" />
            </div>
          )}
        </div>
      )}

      {showPlayoff && (
        <div className="space-y-1.5">
          <Label htmlFor="playoffFormat">Playoff bracket format</Label>
          <Select name="playoffFormat" defaultValue="SINGLE_ELIM">
            <SelectTrigger id="playoffFormat" className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE_ELIM">Single elimination</SelectItem>
              <SelectItem value="DOUBLE_ELIM">Double elimination</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="pointsToWin">Points to win</Label>
          <Input id="pointsToWin" name="pointsToWin" type="number" min={1} max={99} defaultValue={11} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gamesPerMatch">Games per match</Label>
          <Input id="gamesPerMatch" name="gamesPerMatch" type="number" min={1} max={5} defaultValue={1} className="h-10" />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch id="winByTwo" name="winByTwo" defaultChecked />
          <Label htmlFor="winByTwo">Win by two</Label>
        </div>
      </div>

      <SubmitButton label={submitLabel} />
    </form>
  );
}
