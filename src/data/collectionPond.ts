export const collectionPondSlots = [
  { id: 'water-1', left: 18, top: 47, width: 112, depth: 1, rotation: -3 },
  { id: 'water-2', left: 81, top: 50, width: 118, depth: 1, rotation: 3 },
  { id: 'water-3', left: 50, top: 59, width: 138, depth: 2, rotation: -1 },
  { id: 'water-4', left: 22, top: 66, width: 152, depth: 3, rotation: 2 },
  { id: 'water-5', left: 78, top: 66, width: 152, depth: 3, rotation: -2 },
] as const;

export type CollectionPondSlotId = typeof collectionPondSlots[number]['id'];
