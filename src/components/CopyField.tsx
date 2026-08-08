"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function CopyField({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-1">
      {label && <Label className="text-xs font-medium text-muted-foreground">{label}</Label>}
      <div className="flex items-center gap-2">
        <Input readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="h-9 font-mono text-xs" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
