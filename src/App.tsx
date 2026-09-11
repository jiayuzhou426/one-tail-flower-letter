import { useState } from 'react';
import { GameProvider, useGame } from './GameContext';
import type { Page } from './types';
import { flowers } from './data/flowers';
import { IntroPage } from './pages/IntroPage';
import { ExplorePage } from './pages/ExplorePage';
import { PondPage } from './pages/PondPage';
import { ArrangePage } from './pages/ArrangePage';
import { BottomNav } from './components/BottomNav';
import { Fish } from './components/Fish';
import { Ripple } from './components/Ripple';
import { MapEditor } from './components/MapEditor';
import { SpringPondFrame } from './components/SpringPondFrame';

function Shell() {
  const { data, receive } = useGame();
  const [page, setPage] = useState<Page>(data.hasSeenIntro ? 'pond' : 'intro');
  const [message, setMessage] = useState(false);
  const start = () => setPage('explore');
  const finish = (_biome: string, rainy: boolean) => {
    setPage('transition');
    setMessage(true);
    setTimeout(() => {
      const undiscovered = flowers.filter((flower) => !data.discoveredFlowerIds.includes(flower.id));
      let chosen = 'lotus';
      if (data.totalTrips > 0) {
        const candidates = Math.random() < .7 && undiscovered.length ? undiscovered : flowers;
        const rainPick = rainy && Math.random() < .45 ? flowers.find((flower) => flower.id === 'nameless') : undefined;
        chosen = (rainPick || candidates[Math.floor(Math.random() * candidates.length)]).id;
      }
      receive(chosen);
      setPage('pond');
    }, 2050);
  };

  if (new URLSearchParams(window.location.search).get('mapEditor') === '1') return <MapEditor />;

  return (
    <div className="app-shell">
      {page === 'intro' && <IntroPage start={start} />}
      {page === 'explore' && <ExplorePage finish={finish} />}
      {page === 'transition' && (
        <main className="transition page">
          <Ripple />
          <Fish />
          <p className={message ? 'show' : ''}>二十秒到了。<br />鱼把自己还给了水。</p>
          <i className="drop" />
        </main>
      )}
      {page === 'pond' && <PondPage openArrange={() => setPage('arrange')} />}
      {page === 'arrange' && <ArrangePage />}
      {data.hasSeenIntro && page !== 'transition' && <BottomNav page={page} setPage={setPage} />}
    </div>
  );
}

export default function App() {
  if (new URLSearchParams(window.location.search).get('exploreCollision') === '1') {
    return <GameProvider><ExplorePage finish={() => undefined} /></GameProvider>;
  }
  if (new URLSearchParams(window.location.search).get('springPondPreview') === '1') {
    return <SpringPondFrame />;
  }

  return <GameProvider><Shell /></GameProvider>;
}
