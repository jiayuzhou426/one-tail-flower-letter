export type Collider = { x: number; y: number; rx: number; ry: number };
export type Placement = { cluster: number; x: number; y: number; w: number; flip?: boolean; colliders: Collider[] };
export type MapTemplate = { id: string; placements: Placement[] };
type EditorPlacement = Pick<Placement, 'cluster' | 'x' | 'y' | 'w' | 'flip'>;

// Retained for copying configurations out of the visual editor.
export const left = (cluster: number, y: number, w = 380, x = -150): Placement => makePlacement({ cluster, x, y, w, flip: false });
export const right = (cluster: number, y: number, w = 380, x = 470): Placement => makePlacement({ cluster, x, y, w, flip: true });

function makePlacement(item: EditorPlacement): Placement {
  return {
    ...item,
    colliders: [{ x: item.x + item.w * 0.5, y: item.y + item.w * 0.48, rx: item.w * 0.3, ry: item.w * 0.31 }],
  };
}
const map = (id: string, placements: EditorPlacement[]): MapTemplate => ({ id, placements: placements.map(makePlacement) });

// Imported unchanged from the five user-authored map-editor JSON exports.
export const templates: MapTemplate[] = [
  map('hand-map-1', [
    { cluster: 0, x: -64, y: 657, w: 380, flip: true }, { cluster: 7, x: 331, y: 1404, w: 520, flip: true },
    { cluster: 2, x: -47, y: 1013, w: 425, flip: false }, { cluster: 8, x: 286, y: 261, w: 464, flip: true },
    { cluster: 4, x: 436, y: 764, w: 380, flip: false }, { cluster: 8, x: -154, y: 1608, w: 499, flip: false },
    { cluster: 0, x: -150, y: 1000, w: 380, flip: false }, { cluster: 1, x: 19, y: 52, w: 419, flip: false },
  ]),
  map('hand-map-2', [
    { cluster: 8, x: 344, y: 1602, w: 512, flip: true }, { cluster: 1, x: 430, y: 504, w: 447, flip: false },
    { cluster: 12, x: -124, y: 584, w: 520, flip: false }, { cluster: 5, x: 418, y: 985, w: 433, flip: false },
    { cluster: 7, x: 228, y: 52, w: 520, flip: true }, { cluster: 3, x: -95, y: 1645, w: 380, flip: false },
  ]),
  map('hand-map-3', [
    { cluster: 6, x: -90, y: 1609, w: 520, flip: false }, { cluster: 2, x: 343, y: 1315, w: 512, flip: true },
    { cluster: 9, x: -171, y: 999, w: 490, flip: true }, { cluster: 12, x: -95, y: -26, w: 520, flip: true },
    { cluster: 4, x: 442, y: 617, w: 380, flip: true }, { cluster: 3, x: 334, y: 66, w: 380, flip: false },
  ]),
  map('hand-map-4', [
    { cluster: 11, x: -41, y: 1050, w: 520, flip: true }, { cluster: 4, x: 414, y: 1317, w: 380, flip: false },
    { cluster: 4, x: 420, y: -43, w: 381, flip: false }, { cluster: 0, x: 177, y: 658, w: 425, flip: false },
    { cluster: 10, x: -17, y: 1625, w: 380, flip: true }, { cluster: 8, x: -48, y: 187, w: 438, flip: true },
  ]),
  map('hand-map-5', [
    { cluster: 3, x: -89, y: 957, w: 380, flip: false }, { cluster: 7, x: -184, y: 1369, w: 520, flip: true },
    { cluster: 12, x: 349, y: 1160, w: 512, flip: false }, { cluster: 1, x: 202, y: 717, w: 328, flip: true },
    { cluster: 4, x: 358, y: -76, w: 421, flip: false }, { cluster: 4, x: -106, y: 130, w: 434, flip: true },
  ]),
];
