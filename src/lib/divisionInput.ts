import { z } from "zod";

export const divisionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  format: z.enum(["SINGLE_ELIM", "DOUBLE_ELIM", "ROUND_ROBIN", "POOL_PLAY"]),
  pointsToWin: z.coerce.number().int().min(1).max(99),
  winByTwo: z.coerce.boolean(),
  gamesPerMatch: z.coerce.number().int().min(1).max(5),
  poolCount: z.coerce.number().int().min(1).max(32),
  advancePerPool: z.coerce.number().int().min(1).max(8),
  playoffFormat: z.enum(["SINGLE_ELIM", "DOUBLE_ELIM"]),
});

export type DivisionInput = z.infer<typeof divisionSchema>;

export function parseDivisionInput(formData: FormData): DivisionInput {
  const parsed = divisionSchema.safeParse({
    name: formData.get("name"),
    format: formData.get("format"),
    pointsToWin: formData.get("pointsToWin") || 11,
    winByTwo: formData.get("winByTwo") === "on",
    gamesPerMatch: formData.get("gamesPerMatch") || 1,
    poolCount: formData.get("poolCount") || 1,
    advancePerPool: formData.get("advancePerPool") || 2,
    playoffFormat: formData.get("playoffFormat") || "SINGLE_ELIM",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }
  return parsed.data;
}
