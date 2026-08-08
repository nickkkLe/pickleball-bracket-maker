"use client";

import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { reportActionError } from "@/lib/actionError";

export function CodeEntryForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          try {
            await action(fd);
          } catch (e) {
            reportActionError(e);
          }
        });
      }}
      className="flex gap-2"
    >
      <Input
        name="code"
        required
        placeholder="Your code (e.g. K7RQ2)"
        autoCapitalize="characters"
        className="h-10 min-w-0 flex-1 uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal"
      />
      <Button type="submit" disabled={pending} className="h-10 shrink-0">
        {pending ? "…" : "Go"}
      </Button>
    </form>
  );
}
