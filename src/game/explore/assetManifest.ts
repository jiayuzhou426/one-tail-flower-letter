const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const exploreAssets = {
  water: publicAsset('assets/explore/final/water/water.png'),
  fish: Array.from({ length: 7 }, (_, index) => publicAsset(`assets/explore/final/fish/fish-${index}.png`)),
  clusters: Array.from({ length: 13 }, (_, index) => publicAsset(`assets/explore/final/clusters/cluster-${index}.png`)),
};
