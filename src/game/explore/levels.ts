export type ExploreLevel = {
  id: string;
  name: string;
  imageSrc: string;
  maskSrc: string;
};

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

// User-provided order: test4, test1, test2, test3, test5.
export const exploreLevels: ExploreLevel[] = [
  { id: 'pastel-lotus', name: '粉荷回湾', imageSrc: publicAsset('assets/explore/levels/level-1.png'), maskSrc: publicAsset('assets/explore/levels/level-1-mask.png') },
  { id: 'soft-bank', name: '柔岸曲水', imageSrc: publicAsset('assets/explore/levels/level-2.png'), maskSrc: publicAsset('assets/explore/levels/level-2-mask.png') },
  { id: 'crystal-rock', name: '晶石浅涧', imageSrc: publicAsset('assets/explore/levels/level-3.png'), maskSrc: publicAsset('assets/explore/levels/level-3-mask.png') },
  { id: 'flower-rock', name: '花石清溪', imageSrc: publicAsset('assets/explore/levels/level-4.png'), maskSrc: publicAsset('assets/explore/levels/level-4-mask.png') },
  { id: 'lotus-stars', name: '星荷水路', imageSrc: publicAsset('assets/explore/levels/level-5.png'), maskSrc: publicAsset('assets/explore/levels/level-5-mask.png') },
];
