"use client";

import { ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export function QrCodeDialog({
  dataUrl,
  title = "Scan to open",
  description,
  thumbnailSize = 88,
}: {
  dataUrl: string;
  title?: string;
  description?: string;
  thumbnailSize?: number;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="group relative block shrink-0 self-start overflow-hidden rounded-lg border border-border bg-white p-1.5 transition hover:border-primary/50"
            aria-label="View larger QR code"
          />
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt="QR code" width={thumbnailSize} height={thumbnailSize} />
        <span className="absolute inset-0 flex items-center justify-center bg-white/80 opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIn className="size-5 text-foreground" />
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex justify-center p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt="QR code" width={320} height={320} className="rounded-lg" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
