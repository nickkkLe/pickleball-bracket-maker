"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export interface ConnectorItem {
  id: string;
  round: number;
  position: number;
  nextMatchId: string | null;
  content: ReactNode;
}

export function BracketColumns({ items, roundLabels }: { items: ConnectorItem[]; roundLabels: Record<number, string> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const [paths, setPaths] = useState<string[]>([]);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });
  const [overflowing, setOverflowing] = useState(false);

  const rounds = [...new Set(items.map((i) => i.round))].sort((a, b) => a - b);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function recompute() {
      if (!container) return;
      const byTarget = new Map<string, ConnectorItem[]>();
      for (const item of items) {
        if (!item.nextMatchId || !cardRefs.current.has(item.nextMatchId)) continue;
        const arr = byTarget.get(item.nextMatchId) ?? [];
        arr.push(item);
        byTarget.set(item.nextMatchId, arr);
      }

      const newPaths: string[] = [];
      for (const [targetId, feeders] of byTarget) {
        const targetEl = cardRefs.current.get(targetId);
        if (!targetEl) continue;
        const targetLeftX = targetEl.offsetLeft;
        const targetY = targetEl.offsetTop + targetEl.offsetHeight / 2;
        const sorted = [...feeders].sort((a, b) => a.position - b.position);
        const els = sorted.map((f) => cardRefs.current.get(f.id)).filter(Boolean) as HTMLDivElement[];
        if (els.length === 0) continue;

        if (els.length === 2) {
          const [el1, el2] = els;
          const rightX = el1.offsetLeft + el1.offsetWidth;
          const y1 = el1.offsetTop + el1.offsetHeight / 2;
          const y2 = el2.offsetTop + el2.offsetHeight / 2;
          const trunkX = rightX + (targetLeftX - rightX) / 2;
          newPaths.push(
            `M ${rightX} ${y1} H ${trunkX} M ${rightX} ${y2} H ${trunkX} M ${trunkX} ${y1} V ${y2} M ${trunkX} ${targetY} H ${targetLeftX}`
          );
        } else {
          const el = els[0];
          const rightX = el.offsetLeft + el.offsetWidth;
          const y = el.offsetTop + el.offsetHeight / 2;
          const trunkX = rightX + (targetLeftX - rightX) / 2;
          newPaths.push(`M ${rightX} ${y} H ${trunkX} V ${targetY} H ${targetLeftX}`);
        }
      }
      setPaths(newPaths);
      setSvgSize({ width: container.scrollWidth, height: container.scrollHeight });
      setOverflowing(container.scrollWidth > container.clientWidth + 1);
    }

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(container);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [items]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="overflow-x-auto pb-2"
        style={overflowing ? { maskImage: "linear-gradient(to right, black calc(100% - 40px), transparent)", WebkitMaskImage: "linear-gradient(to right, black calc(100% - 40px), transparent)" } : undefined}
      >
        <svg className="pointer-events-none absolute top-0 left-0 text-border" width={svgSize.width} height={svgSize.height} style={{ overflow: "visible" }}>
          {paths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={1.5} />
          ))}
        </svg>
        <div className="flex gap-10">
          {rounds.map((round) => (
            <div key={round} className="flex w-64 shrink-0 flex-col gap-6">
              <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{roundLabels[round] ?? `Round ${round}`}</div>
              <div className="flex flex-1 flex-col justify-around gap-6">
                {items
                  .filter((i) => i.round === round)
                  .sort((a, b) => a.position - b.position)
                  .map((item) => (
                    <div
                      key={item.id}
                      ref={(el) => {
                        if (el) cardRefs.current.set(item.id, el);
                        else cardRefs.current.delete(item.id);
                      }}
                    >
                      {item.content}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {overflowing && (
        <div className="pointer-events-none absolute top-0 right-0 flex h-full items-center pr-1 text-muted-foreground">
          <ChevronRight className="size-4 animate-pulse" />
        </div>
      )}
    </div>
  );
}
