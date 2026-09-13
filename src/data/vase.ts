// 花瓶编辑器的范围在这里冻结：不提供皮肤或背景切换。
export const VASE_ID = 'frosted-letter-v1' as const;
const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const VASE_ASSET = publicAsset('assets/vase/frosted-letter-vase-v1.png');
export const VASE_BACKGROUND_ASSET = publicAsset('assets/vase/vase-letter-room-v2.png');
export const MAX_VASE_STEMS = 7;

export const vaseStemSlots = [
  // Every stem starts from the mouth of the vase.  The small horizontal
  // offsets create a bouquet, rather than placing individual flowers around it.
  { left: 50, mouth: 70, angle: -2, layer: 4 },
  { left: 45, mouth: 70, angle: -12, layer: 3 },
  { left: 55, mouth: 70, angle: 12, layer: 5 },
  { left: 41, mouth: 70, angle: -18, layer: 2 },
  { left: 59, mouth: 70, angle: 18, layer: 6 },
  { left: 47, mouth: 70, angle: -7, layer: 1 },
  { left: 53, mouth: 70, angle: 7, layer: 7 },
] as const;
