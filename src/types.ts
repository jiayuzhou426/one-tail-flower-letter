export type Page = 'intro' | 'explore' | 'transition' | 'pond' | 'arrange';
export interface FlowerDefinition { id: string; name: string; biome: string; meaning: string; rarity: string; discovery: string; colors: string[] }
export interface BiomeDefinition { id: string; name: string; water: string; rainy: boolean }
export interface ExploreSession { biomeId: string; rainy: boolean; startedAt: number }
export interface PendingSeed { flowerId: string; id: string }
export interface FlowerPatchPoint { x: number; y: number; scale: number; rotation: number; delay: number }
export interface FlowerPatch { id: string; flowerId: string; points: FlowerPatchPoint[]; plantedAt: number }
/** Legacy v1 shape, retained only while reading old saves. */
export interface PlantedFlower { id: string; flowerId: string; x: number; y: number; plantedAt: number }
export interface BouquetStem { id: string; flowerId: string; slot: number; heightOffset: number; angle: number }
export interface SaveData { version: 2; hasSeenIntro: boolean; discoveredFlowerIds: string[]; pendingSeed: PendingSeed | null; flowerPatches: FlowerPatch[]; bouquet: BouquetStem[]; totalTrips: number; soundEnabled: boolean }
