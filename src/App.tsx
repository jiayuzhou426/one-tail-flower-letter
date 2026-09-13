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
import { preloadFlowerAssets } from './utils/preloadFlowerAssets';

function Shell() {
  const { data, receive } = useGame();
  const [page, setPage] = useState<Page>(data.hasSeenIntro ? 'pond' : 'intro');
  const [message, setMessage] = useState(false);
  const start = () => setPage('explore');
  const finish = (_biome: string, _rainy: boolean) => {
    const nextFlower = flowers.find(f => !data.pondPlants.some(plant => plant.flowerId === f.id));
    if (data.pendingSeed || !nextFlower) {
      setPage('pond');
      return;
    }
    preloadFlowerAssets(nextFlower.id);
    setPage('transition');
    setMessage(true);
    setTimeout(() => {
      receive(nextFlower.id);
      setPage('pond');
    }, 2050);
  };

  if (new URLSearchParams(window.location.search).get('mapEditor') === '1') return <MapEditor/>;
  return <div className="app-shell">
    {page === 'intro' && <IntroPage start={start}/>}
    {page === 'explore' && <ExplorePage finish={finish}/>}
    {page === 'transition' && <main className="transition page"><Ripple/><Fish/><p className={message ? 'show' : ''}>二十秒到了。<br/>鱼把自己还给了水。</p><i className="drop"/></main>}
    {page === 'pond' && <PondPage openArrange={() => setPage('arrange')}/>}
    {page === 'arrange' && <ArrangePage/>}
    {data.hasSeenIntro && page !== 'transition' && <BottomNav page={page} setPage={setPage}/>}
  </div>;
}

export default function App() {
  if (new URLSearchParams(window.location.search).get('exploreCollision') === '1') {
    return <GameProvider><ExplorePage finish={() => undefined}/></GameProvider>;
  }
  return <GameProvider><Shell/></GameProvider>;
}
