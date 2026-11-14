/**
 * Mulberry32: a tiny, fast, seedable 32-bit PRNG.
 * Same seed -> same sequence on every machine, which keeps the simulated
 * dataset reproducible for demos and tests. Not for cryptography.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Standard normal sample (Box–Muller) from a uniform source. */
export function gaussian(rand: () => number): number {
  const u = 1 - rand() // (0, 1] so log() is finite
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** Uniform float in [min, max). */
export function between(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min)
}
