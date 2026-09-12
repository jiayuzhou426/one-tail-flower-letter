import type { FlowerDefinition } from '../types';

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const asset = (name: string) => publicAsset(`assets/vase/flowers/${name}`);
const pondCluster = (name: string) => publicAsset(`assets/pond/clusters/${name}`);

export const flowers: FlowerDefinition[] = [
  {
    id: 'garden_rose', name: '花园玫瑰', biome: '晨雾花坞', meaning: '靠近', rarity: '普通',
    discovery: '它在水里，仍把春天开得很近。', colors: ['#F2A8B7', '#F7E5DF'], pondScale: 1.05,
    pondClusterAsset: pondCluster('garden-rose-pond-cluster-v1.png'),
    assets: { bud: asset('garden-rose-bud-v1.png'), 'half-open': asset('garden-rose-half-open-v1.png'), bloom: asset('garden-rose-stem-v1.png') },
  },
  {
    id: 'tulip', name: '杏色郁金香', biome: '晴窗浅湾', meaning: '期待', rarity: '普通',
    discovery: '水面把尚未说出的期待，轻轻托住。', colors: ['#F5B48D', '#F9E6BD'], pondScale: .92,
    pondClusterAsset: pondCluster('tulip-pond-cluster-v1.png'),
    assets: { bud: asset('tulip-bud-v1.png'), 'half-open': asset('tulip-half-open-v1.png'), bloom: asset('tulip-stem-v1.png') },
  },
  {
    id: 'lisianthus', name: '淡紫洋桔梗', biome: '微雨花桥', meaning: '安静', rarity: '较少',
    discovery: '有些柔软，会在最清澈的地方留下来。', colors: ['#B59BCF', '#F5EEF5'], pondScale: 1,
    pondClusterAsset: pondCluster('lisianthus-pond-cluster-v1.png'),
    assets: { bud: asset('lisianthus-bud-v1.png'), 'half-open': asset('lisianthus-half-open-v1.png'), bloom: asset('lisianthus-stem-v1.png') },
  },
  {
    id: 'iris', name: '蓝鸢尾', biome: '远岸风径', meaning: '回音', rarity: '普通',
    discovery: '风没有回答，只留下了一束蓝色的回音。', colors: ['#6678C8', '#F2CE63'], pondScale: 1.06,
    pondClusterAsset: pondCluster('iris-pond-cluster-v1.png'),
    assets: { bud: asset('iris-bud-v1.png'), 'half-open': asset('iris-half-open-v1.png'), bloom: asset('iris-stem-v1.png') },
  },
  {
    id: 'narcissus', name: '金盏水仙', biome: '淡金晨水', meaning: '归来', rarity: '稀有',
    discovery: '绕过很远的水，仍会回到这里。', colors: ['#FFF8D0', '#F2CE63'], pondScale: .98,
    pondClusterAsset: pondCluster('narcissus-pond-cluster-v1.png'),
    assets: { bud: asset('narcissus-bud-v1.png'), 'half-open': asset('narcissus-half-open-v1.png'), bloom: asset('narcissus-stem-v1.png') },
  },
];

export const flowerById = (id: string) => flowers.find(f => f.id === id)!;
