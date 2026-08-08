"use client";

import { useEffect } from "react";
import { rememberEvent } from "@/lib/adminLinks";

export function RecordAdminVisit({ id, name, adminToken }: { id: string; name: string; adminToken: string }) {
  useEffect(() => {
    rememberEvent({ id, name, adminToken });
  }, [id, name, adminToken]);

  return null;
}
