import type { BouquetStem, FlowerStage, PendingSeed, PondPlant, SaveData } from './types';
import { MAX_VASE_STEMS } from './data/vase';

const key = 'one-tail-flower-letter-save-v1';
const validIds = new Set(['garden_rose', 'tulip', 'lisianthus', 'iris', 'narcissus']);
const legacyIds: Record<string, string> = { lotus: 'garden_rose', water_lily: 'tulip', nameless: 'lisianthus', iris: 'iris', narcissus: 'narcissus' };
const slotIds = ['water-1', 'water-2', 'water-3', 'water-4', 'water-5'];

const normalizeFlowerId = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const id = legacyIds[value] ?? value;
  return validIds.has(id) ? id : null;
};

const uniqueFlowerIds = (values: unknown[]) => Array.from(new Set(values.map(normalizeFlowerId).filter((id): id is string => Boolean(id)))).slice(0, 5);
const isStage = (value: unknown): value is FlowerStage => value === 'bud' || value === 'half-open' || value === 'bloom';

const normalizePlants = (raw: unknown): PondPlant[] => {
  if (!Array.isArray(raw)) return [];
  const usedFlowers = new Set<string>();
  const usedSlots = new Set<string>();
  return raw.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const flowerId = normalizeFlowerId(record.flowerId);
    const slotId = typeof record.slotId === 'string' && slotIds.includes(record.slotId) ? record.slotId : slotIds[index];
    if (!flowerId || !slotId || usedFlowers.has(flowerId) || usedSlots.has(slotId)) return [];
    usedFlowers.add(flowerId); usedSlots.add(slotId);
    return [{
      id: typeof record.id === 'string' ? record.id : crypto.randomUUID(),
      flowerId,
      slotId,
      plantedAt: typeof record.plantedAt === 'number' ? record.plantedAt : Date.now(),
      stage: isStage(record.stage) ? record.stage : 'bloom',
    }];
  }).slice(0, 5);
};

const normalizeBouquet = (raw: unknown): BouquetStem[] => {
  if (!Array.isArray(raw)) return [];
  const usedSlots = new Set<number>();
  return raw.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const flowerId = normalizeFlowerId(record.flowerId);
    if (!flowerId) return [];
    const requestedSlot = typeof record.slot === 'number' ? Math.floor(record.slot) : -1;
    const slot = requestedSlot >= 0 && requestedSlot < MAX_VASE_STEMS && !usedSlots.has(requestedSlot)
      ? requestedSlot
      : Array.from({ length: MAX_VASE_STEMS }, (_, index) => index).find(index => !usedSlots.has(index));
    if (slot === undefined) return [];
    usedSlots.add(slot);
    return [{
      id: typeof record.id === 'string' ? record.id : crypto.randomUUID(),
      flowerId,
      slot,
      heightOffset: typeof record.heightOffset === 'number' ? record.heightOffset : 0,
      angle: typeof record.angle === 'number' ? record.angle : 0,
      stage: isStage(record.stage) ? record.stage : 'bloom',
    }];
  });
};

const normalizePending = (raw: unknown, plantedIds: string[]): PendingSeed | null => {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const flowerId = normalizeFlowerId(record.flowerId);
  if (!flowerId || plantedIds.includes(flowerId)) return null;
  return { flowerId, id: typeof record.id === 'string' ? record.id : crypto.randomUUID() };
};

export const defaults = (): SaveData => ({
  version: 3,
  hasSeenIntro: false,
  discoveredFlowerIds: [],
  pendingSeed: null,
  pondPlants: [],
  bouquet: [],
  totalTrips: 0,
  soundEnabled: false,
});

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaults();
    const value = JSON.parse(raw) as Record<string, unknown>;
    let pondPlants = normalizePlants(value.pondPlants);
    if (!pondPlants.length) {
      const legacySources = [
        ...(Array.isArray(value.discoveredFlowerIds) ? value.discoveredFlowerIds : []),
        ...(Array.isArray(value.flowerPatches) ? value.flowerPatches.map(item => item && typeof item === 'object' ? (item as Record<string, unknown>).flowerId : null) : []),
      ];
      pondPlants = uniqueFlowerIds(legacySources).map((flowerId, index) => ({ id: crypto.randomUUID(), flowerId, slotId: slotIds[index], plantedAt: Date.now(), stage: 'bloom' }));
    }
    const plantedIds = pondPlants.map(plant => plant.flowerId);
    const discoveredFlowerIds = uniqueFlowerIds([
      ...plantedIds,
      ...(Array.isArray(value.discoveredFlowerIds) ? value.discoveredFlowerIds : []),
    ]);
    return {
      version: 3,
      hasSeenIntro: Boolean(value.hasSeenIntro),
      discoveredFlowerIds,
      pendingSeed: normalizePending(value.pendingSeed, plantedIds),
      pondPlants,
      bouquet: normalizeBouquet(value.bouquet),
      totalTrips: typeof value.totalTrips === 'number' ? Math.max(0, value.totalTrips) : 0,
      soundEnabled: Boolean(value.soundEnabled),
    };
  } catch {
    return defaults();
  }
}

export const save = (data: SaveData) => localStorage.setItem(key, JSON.stringify(data));
export const clearSave = () => localStorage.removeItem(key);
