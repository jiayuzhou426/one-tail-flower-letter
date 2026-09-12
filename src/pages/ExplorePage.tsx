import { useEffect, useMemo, useState } from 'react';
import { biomes } from '../data/biomes';
import { exploreLevels } from '../game/explore/levels';
import { ExplorationCanvas } from '../components/ExplorationCanvas';
import { ExploreAssetPreview } from '../components/ExploreAssetPreview';
import { useGame } from '../GameContext';

export function ExplorePage({ finish }: { finish: (biome: string, rainy: boolean) => void }) {
  const { data } = useGame();
  const query = new URLSearchParams(window.location.search);
  const requestedLevelValue = Number(query.get('level'));
  const requestedLevel = Number.isFinite(requestedLevelValue) && requestedLevelValue >= 1
    ? Math.min(5, Math.floor(requestedLevelValue))
    : 0;
  const collisionDebug = query.get('collisionDebug') === '1';
  const [debugProgress, setDebugProgress] = useState(.5);
  const session = useMemo(() => {
    // Completed trips advance through all five authored maps without an
    // immediate random repeat. The explicit debug level still takes priority.
    const index = requestedLevel ? requestedLevel - 1 : data.totalTrips % exploreLevels.length;
    const biome = biomes[index];
    return { biome, level: exploreLevels[index], rainy: biome.rainy || Math.random() < .22 };
  }, [data.totalTrips, requestedLevel]);
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setHint(false), 2300);
    return () => window.clearTimeout(timer);
  }, []);

  if (query.get('exploreAssets') === '1') return <ExploreAssetPreview />;

  return (
    <main className="explore page">
      <div className="explore-canvas-shell">
        <ExplorationCanvas
          biome={session.biome}
          rainy={session.rainy}
          debugProgress={debugProgress}
          onDone={() => finish(session.biome.id, session.rainy)}
        />
      </div>
      <div className="explore-shade" aria-hidden="true" />
      <header className="explore-head">
        <div>
          <p className="eyebrow">水路远游</p>
          <span>{session.level.name}{session.rainy ? ' · 细雨' : ''}</span>
        </div>
        {!collisionDebug && <div className="explore-progress" aria-label="二十秒航程"><span>航程</span><div>{[...Array(20)].map((_, index) => <i key={index} className="time-dot" style={{ animationDelay: `${index}s` }} />)}</div></div>}
      </header>
      {!collisionDebug && <section className={`explore-guide ${hint ? 'is-visible' : ''}`} aria-live="polite"><b>↔</b><p>向左或向右滑动，引导小鱼穿过水路</p></section>}
      {!collisionDebug && <p className="explore-footer">每次归来，会带来一朵新的花。</p>}
      {collisionDebug && (
        <aside className="collision-inspector" aria-label="连续碰撞轮廓检查器">
          <strong>关卡 {requestedLevel || biomes.indexOf(session.biome) + 1} · 连续碰撞轮廓</strong>
          <span>白线＝蒙版岸线 · 青色＝水域 · 鱼的黄圈需完整留在白线内</span>
          <label>
            地图位置 {Math.round(debugProgress * 100)}%
            <input
              type="range"
              min="0"
              max="1"
              step="0.002"
              value={debugProgress}
              onChange={(event) => setDebugProgress(Number(event.target.value))}
            />
          </label>
        </aside>
      )}
    </main>
  );
}
