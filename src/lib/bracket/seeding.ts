export function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return Math.max(p, 1);
}

/**
 * Standard tournament bracket seed order: for a bracket of `size` slots,
 * returns the seed number (1-indexed) that belongs in each slot, arranged so
 * that seed 1 and seed 2 can only meet in the final, seeds 1-4 can only meet
 * from the semifinal on, etc.
 */
export function seedOrder(size: number): number[] {
  if (size <= 1) return [1];
  const prev = seedOrder(size / 2);
  const result: number[] = [];
  for (const s of prev) {
    result.push(s, size + 1 - s);
  }
  return result;
}
