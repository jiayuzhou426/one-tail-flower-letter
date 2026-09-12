import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { BouquetStem, SaveData } from './types';
import { collectionPondSlots } from './data/collectionPond';
import { MAX_VASE_STEMS } from './data/vase';
import { clearSave, loadSave, save } from './persistence';

const pondSlotIds = new Set<string>(collectionPondSlots.map(slot => slot.id));

type Ctx = {
  data: SaveData;
  lastSavedAt: number | null;
  patch: (p: Partial<SaveData>) => void;
  receive: (id: string) => void;
  plantInPond: (slotId: string) => void;
  setBouquet: (b: BouquetStem[]) => void;
  reset: () => void;
};

const GameContext = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState(loadSave);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  useEffect(() => {
    save(data);
    setLastSavedAt(Date.now());
  }, [data]);

  const value = useMemo<Ctx>(() => ({
    data,
    lastSavedAt,
    patch: p => setData(d => ({ ...d, ...p })),
    receive: id => setData(d => d.pendingSeed || d.pondPlants.some(plant => plant.flowerId === id) ? d : ({
      ...d,
      hasSeenIntro: true,
      totalTrips: d.totalTrips + 1,
      pendingSeed: { flowerId: id, id: crypto.randomUUID() },
    })),
    plantInPond: slotId => setData(d => {
      const flowerId = d.pendingSeed?.flowerId;
      if (!flowerId || !pondSlotIds.has(slotId) || d.pondPlants.some(plant => plant.slotId === slotId) || d.pondPlants.some(plant => plant.flowerId === flowerId)) return d;
      return {
        ...d,
        pendingSeed: null,
        discoveredFlowerIds: Array.from(new Set([...d.discoveredFlowerIds, flowerId])),
        pondPlants: [...d.pondPlants, { id: crypto.randomUUID(), flowerId, slotId, plantedAt: Date.now(), stage: 'bloom' }],
      };
    }),
    setBouquet: bouquet => setData(d => ({ ...d, bouquet: bouquet.slice(0, MAX_VASE_STEMS) })),
    reset: () => { clearSave(); setData(loadSave()); },
  }), [data, lastSavedAt]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw Error('GameProvider required');
  return context;
};
