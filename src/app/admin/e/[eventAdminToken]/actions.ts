"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { newAdminToken, newSlug } from "@/lib/ids";
import { parseDivisionInput } from "@/lib/divisionInput";
import { logAudit } from "@/lib/audit";

async function requireEventAdmin(eventId: string, adminToken: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.adminToken !== adminToken) throw new Error("Not authorized");
  return event;
}

export async function createDivision(eventId: string, eventAdminToken: string, formData: FormData) {
  const event = await requireEventAdmin(eventId, eventAdminToken);
  const data = parseDivisionInput(formData);

  const slug = newSlug(`${event.name}-${data.name}`);
  const adminToken = newAdminToken();

  const division = await prisma.tournament.create({
    data: {
      eventId: event.id,
      name: data.name,
      slug,
      adminToken,
      format: data.format,
      pointsToWin: data.pointsToWin,
      winByTwo: data.winByTwo,
      gamesPerMatch: data.gamesPerMatch,
      poolCount: data.format === "ROUND_ROBIN" || data.format === "POOL_PLAY" ? data.poolCount : 1,
      advancePerPool: data.advancePerPool,
      playoffFormat: data.playoffFormat,
    },
  });

  await logAudit(division.id, "admin", "tournament.create", `Bracket "${data.name}" added to event "${event.name}"`);

  revalidatePath(`/admin/e/${eventAdminToken}`);
  redirect(`/admin/${adminToken}`);
}
