export type Page = 'intro' | 'explore' | 'transition' | 'pond' | 'arrange';
export interface FlowerDefinition { id: string; name: string; biome: string; meaning: string; rarity: string; discovery: string; colors: string[] }
export interface BiomeDefinition { id: string; name: string; water: string; rainy: boolean }
export interface ExploreSession { biomeId: string; rainy: boolean; startedAt: number }
export interface PendingSeed { flowerId: string; id: string }
export interface PlantedFlower { id: string; flowerId: string; x: number; y: number; plantedAt: number }
export interface BouquetStem { id: string; flowerId: string; slot: number; heightOffset: number; angle: number }
export interface SaveData { version: 1; hasSeenIntro: boolean; discoveredFlowerIds: string[]; pendingSeed: PendingSeed | null; plantedFlowers: PlantedFlower[]; bouquet: BouquetStem[]; totalTrips: number; soundEnabled: boolean }
