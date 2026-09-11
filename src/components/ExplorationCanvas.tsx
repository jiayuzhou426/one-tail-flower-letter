import type { BiomeDefinition } from '../types';
import { exploreLevels } from '../game/explore/levels';
import { WaterRippleField } from './WaterRippleField';

const biomeOrder = ['lotus', 'reeds', 'mist', 'sand', 'cove'];

type ExplorationCanvasProps = {
  biome: BiomeDefinition;
  rainy: boolean;
  onDone: (got: boolean) => void;
  debugProgress?: number;
};

export function ExplorationCanvas({ biome, onDone, debugProgress }: ExplorationCanvasProps) {
  const query = new URLSearchParams(window.location.search);
  const requestedLevel = Number(query.get('level'));
  const biomeLevel = Math.max(0, biomeOrder.indexOf(biome.id));
  const levelIndex = Number.isFinite(requestedLevel) && requestedLevel >= 1
    ? Math.min(exploreLevels.length - 1, Math.floor(requestedLevel) - 1)
    : biomeLevel;
  const level = exploreLevels[levelIndex];
  const collisionDebug = query.get('collisionDebug') === '1';

  return (
    <div className="explore-stage" aria-label={`${level.name}探索地图`}>
      <img className="explore-stage__fallback" src={level.imageSrc} alt="" />
      <WaterRippleField
        className="explore-canvas"
        imageSrc={level.imageSrc}
        maskSrc={level.maskSrc}
        fishX={.5}
        fishY={.68}
        fishWake
        playable
        durationMs={20_000}
        progressOverride={collisionDebug ? debugProgress : undefined}
        collisionDebug={collisionDebug}
        onComplete={() => onDone(true)}
      />
    </div>
  );
}
