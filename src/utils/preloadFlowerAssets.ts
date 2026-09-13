import { flowerById } from '../data/flowers';

const requested = new Set<string>();

function warmImage(src: string, fallbackSrc?: string) {
  if (!src || requested.has(src) || typeof Image === 'undefined') return;
  requested.add(src);

  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    image.decode?.().catch(() => undefined);
  };
  image.onerror = () => {
    if (fallbackSrc) warmImage(fallbackSrc);
  };
  image.src = src;
}

/**
 * Starts transfer and decoding before a flower is displayed.  This keeps the
 * animation at the end of a voyage and the first vase placement immediate.
 */
export function preloadFlowerAssets(flowerId: string) {
  const flower = flowerById(flowerId);
  if (!flower) return;

  warmImage(flower.pondClusterAsset, flower.pondClusterFallbackAsset);
  (Object.keys(flower.assets) as Array<keyof typeof flower.assets>).forEach(stage => {
    warmImage(flower.assets[stage], flower.assetFallbacks[stage]);
  });
}
