"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { newAdminToken, newSlug } from "@/lib/ids";
import { parseDivisionInput } from "@/lib/divisionInput";

export async function createTournament(formData: FormData) {
  const data = parseDivisionInput(formData);

  const eventSlug = newSlug(data.name);
  const eventAdminToken = newAdminToken();
  const divisionSlug = newSlug(data.name);
  const divisionAdminToken = newAdminToken();

  await prisma.event.create({
    data: {
      name: data.name,
      slug: eventSlug,
      adminToken: eventAdminToken,
      divisions: {
        create: {
          name: data.name,
          slug: divisionSlug,
          adminToken: divisionAdminToken,
          format: data.format,
          pointsToWin: data.pointsToWin,
          winByTwo: data.winByTwo,
          gamesPerMatch: data.gamesPerMatch,
          poolCount: data.format === "ROUND_ROBIN" || data.format === "POOL_PLAY" ? data.poolCount : 1,
          advancePerPool: data.advancePerPool,
          playoffFormat: data.playoffFormat,
        },
      },
    },
  });

  redirect(`/admin/${divisionAdminToken}`);
}
