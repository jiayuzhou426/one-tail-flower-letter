export type Page = 'intro' | 'explore' | 'transition' | 'pond' | 'arrange';

export type FlowerStage = 'bud' | 'half-open' | 'bloom';

export interface FlowerDefinition {
  id: string;
  name: string;
  biome: string;
  meaning: string;
  rarity: string;
  discovery: string;
  colors: string[];
  /** Smaller WebP sources used by modern browsers. */
  assets: Record<FlowerStage, string>;
  /** Original PNG sources retained for browsers without WebP support. */
  assetFallbacks: Record<FlowerStage, string>;
  pondClusterAsset: string;
  pondClusterFallbackAsset: string;
  pondScale: number;
}

export interface BiomeDefinition { id: string; name: string; water: string; rainy: boolean }
export interface ExploreSession { biomeId: string; rainy: boolean; startedAt: number }
export interface PendingSeed { flowerId: string; id: string }
export interface PondPlant { id: string; flowerId: string; slotId: string; plantedAt: number; stage: FlowerStage }
export interface BouquetStem { id: string; flowerId: string; slot: number; heightOffset: number; angle: number; stage: FlowerStage }

export interface SaveData {
  version: 3;
  hasSeenIntro: boolean;
  discoveredFlowerIds: string[];
  pendingSeed: PendingSeed | null;
  pondPlants: PondPlant[];
  bouquet: BouquetStem[];
  totalTrips: number;
  soundEnabled: boolean;
}
