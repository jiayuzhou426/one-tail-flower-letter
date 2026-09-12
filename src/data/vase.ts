// 花瓶编辑器的范围在这里冻结：不提供皮肤或背景切换。
export const VASE_ID = 'frosted-letter-v1' as const;
const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const VASE_ASSET = publicAsset('assets/vase/frosted-letter-vase-v1.png');
export const VASE_BACKGROUND_ASSET = publicAsset('assets/vase/vase-letter-room-v2.png');
export const MAX_VASE_STEMS = 7;

export const vaseStemSlots = [
  { left: 27, top: 67, angle: -14, layer: 1 },
  { left: 48, top: 58, angle: -3, layer: 2 },
  { left: 70, top: 67, angle: 14, layer: 3 },
  { left: 36, top: 76, angle: -8, layer: 4 },
  { left: 63, top: 76, angle: 8, layer: 5 },
  { left: 45, top: 83, angle: -2, layer: 6 },
  { left: 56, top: 83, angle: 2, layer: 7 },
] as const;
