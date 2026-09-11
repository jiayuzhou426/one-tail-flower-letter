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
    return { biome, rainy: biome.rainy || Math.random() < .22 };
  }, [data.totalTrips, requestedLevel]);
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setHint(false), 2300);
    return () => window.clearTimeout(timer);
  }, []);

  if (query.get('exploreAssets') === '1') return <ExploreAssetPreview />;

  return (
    <main className="explore page" style={{ padding: 0, background: '#9bcdea' }}>
      <style>{`
        .explore-stage,.explore-fallback-canvas,.explore-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
        .explore-stage{overflow:hidden;background:#9bcdea}
        .explore-fallback-canvas{touch-action:none}
        .explore-canvas{touch-action:none;opacity:0;pointer-events:none;transition:opacity .35s ease}
        .explore-canvas[data-ready='true']{opacity:1;pointer-events:auto}
        .collision-inspector{position:absolute;z-index:8;left:16px;right:16px;bottom:max(18px,env(safe-area-inset-bottom));display:grid;gap:6px;padding:12px 14px;color:#234d5b;background:rgba(244,253,253,.9);border:1px solid rgba(255,255,255,.9);border-radius:14px;box-shadow:0 8px 28px rgba(31,79,95,.16);font:12px/1.4 system-ui,sans-serif;backdrop-filter:blur(10px)}
        .collision-inspector strong{font-size:13px;font-weight:600}.collision-inspector label{display:grid;gap:4px}.collision-inspector input{width:100%;accent-color:#28a99d}
        body .bottom-nav{display:none!important}
      `}</style>
      <ExplorationCanvas
        biome={session.biome}
        rainy={session.rainy}
        debugProgress={debugProgress}
        onDone={() => finish(session.biome.id, session.rainy)}
      />
      <header className="explore-head">
        <span>{exploreLevels[biomes.indexOf(session.biome)].name}</span>
        {!collisionDebug && <div>{[...Array(20)].map((_, index) => <i key={index} className="time-dot" style={{ animationDelay: `${index}s` }} />)}</div>}
      </header>
      {hint && !collisionDebug && <p className="gesture">左右滑动，改变游向。</p>}
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
