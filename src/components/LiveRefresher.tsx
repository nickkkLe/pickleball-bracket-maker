"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Periodically re-fetches the current route's server data so a bracket or
 * standings view updates as other people check in and submit scores. */
export function LiveRefresher({ intervalMs = 6000 }: { intervalMs?: number }) {
  const router = useRouter();
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        routerRef.current.refresh();
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return null;
}
