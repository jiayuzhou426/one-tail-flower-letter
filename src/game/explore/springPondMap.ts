export const SPRING_POND_WORLD_WIDTH = 700;
export const SPRING_POND_WORLD_HEIGHT = 4096;
export const SPRING_POND_SEGMENT_HEIGHTS = [1366, 1365, 1365] as const;
export const SPRING_POND_MIN_ROUTE_WIDTH = 410;

export type CorridorBounds = {
  center: number;
  left: number;
  right: number;
  width: number;
};

type CorridorKnot = { y: number; center: number; half: number };

// These knots are the authored inner edges of the leaf banks.  The same
// corridor is used by collision, ripple spawning and the optional QA overlay.
// `half` never falls below 205 world units, guaranteeing a 410-unit waterway
// before the fish's own clearance is reserved.
const corridor: readonly CorridorKnot[] = [
  { y: 0, center: 350, half: 230 },
  { y: 256, center: 325, half: 222 },
  { y: 512, center: 272, half: 212 },
  { y: 768, center: 260, half: 207 },
  { y: 1024, center: 310, half: 216 },
  { y: 1280, center: 395, half: 228 },
  { y: 1536, center: 452, half: 210 },
  { y: 1792, center: 440, half: 207 },
  { y: 2048, center: 370, half: 220 },
  { y: 2304, center: 288, half: 213 },
  { y: 2560, center: 245, half: 205 },
  { y: 2816, center: 267, half: 210 },
  { y: 3072, center: 342, half: 224 },
  { y: 3328, center: 425, half: 214 },
  { y: 3584, center: 458, half: 205 },
  { y: 3840, center: 420, half: 219 },
  { y: SPRING_POND_WORLD_HEIGHT, center: 350, half: 232 },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const smoothstep = (value: number) => value * value * (3 - value * 2);

function interpolate(y: number) {
  const sampleY = clamp(y, 0, SPRING_POND_WORLD_HEIGHT);
  for (let index = 0; index < corridor.length - 1; index += 1) {
    const from = corridor[index];
    const to = corridor[index + 1];
    if (sampleY <= to.y) {
      const amount = smoothstep((sampleY - from.y) / (to.y - from.y));
      return {
        center: from.center + (to.center - from.center) * amount,
        half: Math.max(SPRING_POND_MIN_ROUTE_WIDTH / 2, from.half + (to.half - from.half) * amount),
      };
    }
  }
  const last = corridor[corridor.length - 1];
  return { center: last.center, half: last.half };
}

/** Returns the safe, continuous water boundary at a world-Y coordinate. */
export function springPondBoundsAt(y: number): CorridorBounds {
  const { center, half } = interpolate(y);
  const sideInset = 30;
  let left = center - half;
  let right = center + half;

  if (left < sideInset) {
    right += sideInset - left;
    left = sideInset;
  }
  if (right > SPRING_POND_WORLD_WIDTH - sideInset) {
    left -= right - (SPRING_POND_WORLD_WIDTH - sideInset);
    right = SPRING_POND_WORLD_WIDTH - sideInset;
  }

  return { center: (left + right) / 2, left, right, width: right - left };
}

export function isSpringPondOpen(x: number, y: number, inset = 0) {
  const bounds = springPondBoundsAt(y);
  return x >= bounds.left + inset && x <= bounds.right - inset;
}

export function validateSpringPondCorridor() {
  let minimum = Infinity;
  for (let y = 0; y <= SPRING_POND_WORLD_HEIGHT; y += 8) {
    minimum = Math.min(minimum, springPondBoundsAt(y).width);
  }
  return { valid: minimum >= SPRING_POND_MIN_ROUTE_WIDTH, minimumWidth: minimum };
}
