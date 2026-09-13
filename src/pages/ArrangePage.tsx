import { useRef, useState, type CSSProperties } from 'react';
import { useGame } from '../GameContext';
import { Flower } from '../components/Flower';
import { FlowerLetterTray } from '../components/FlowerLetterTray';
import { Vase } from '../components/Vase';
import { flowerById } from '../data/flowers';
import { MAX_VASE_STEMS, VASE_BACKGROUND_ASSET, vaseStemSlots } from '../data/vase';
import type { BouquetStem, FlowerStage } from '../types';

const bouquetStages: FlowerStage[] = ['bloom', 'half-open', 'bud'];

export function ArrangePage() {
  const { data, lastSavedAt, setBouquet } = useGame();
  const [selectedStemId, setSelectedStemId] = useState<string | null>(null);
  const [draggedStemId, setDraggedStemId] = useState<string | null>(null);
  const pressY = useRef(0);
  const isFull = data.bouquet.length >= MAX_VASE_STEMS;
  const selectedStem = data.bouquet.find(stem => stem.id === selectedStemId) ?? null;

  const update = (stem: BouquetStem) => setBouquet(data.bouquet.map(item => item.id === stem.id ? stem : item));
  const add = (flowerId: string) => {
    if (isFull) return;
    const sameFlowerCount = data.bouquet.filter(stem => stem.flowerId === flowerId).length;
    const slot = vaseStemSlots[data.bouquet.length];
    const stem: BouquetStem = {
      id: crypto.randomUUID(),
      flowerId,
      slot: data.bouquet.length,
      heightOffset: 0,
      angle: slot.angle,
      stage: bouquetStages[sameFlowerCount % bouquetStages.length],
    };
    setBouquet([...data.bouquet, stem]);
    setSelectedStemId(stem.id);
  };
  const rotateSelected = (amount: number) => {
    if (!selectedStem) return;
    update({ ...selectedStem, angle: Math.max(-28, Math.min(28, selectedStem.angle + amount)) });
  };
  const changeSelectedStage = (stage: FlowerStage) => {
    if (!selectedStem) return;
    update({ ...selectedStem, stage });
  };
  const removeSelected = () => {
    if (!selectedStem) return;
    setBouquet(data.bouquet.filter(stem => stem.id !== selectedStem.id).map((stem, slot) => ({ ...stem, slot })));
    setSelectedStemId(null);
  };

  return <main className="arrange vase-letter page">
    <img className="vase-letter-backdrop" src={VASE_BACKGROUND_ASSET} alt="" draggable={false} />
    <div className="vase-letter-veil" />
    <header className="vase-letter-head">
      <div><p className="eyebrow">花信花瓶</p><h1>把远方轻轻放进一只瓶子。</h1></div>
      <div className="vase-head-actions">
        <span className="vase-auto-save" aria-live="polite"><i />{lastSavedAt ? '已自动保存' : '正在保存'}</span>
        <button className="vase-reset" type="button" disabled={!data.bouquet.length} onClick={() => { setBouquet([]); setSelectedStemId(null); }}>清空</button>
      </div>
    </header>

    <section className="vase-letter-stage" onPointerUp={() => setDraggedStemId(null)} onPointerCancel={() => setDraggedStemId(null)} aria-label="花瓶编辑台">
      <div className="vase-letter-halo" aria-hidden="true" />
      <div className="vase-letter-counter" aria-hidden="true" />
      <div className="vase-letter-vessel">
        <Vase part="back" />
        {data.bouquet.map(stem => {
          const position = vaseStemSlots[stem.slot] ?? vaseStemSlots[0];
          return <button
            key={stem.id}
            type="button"
            className={`vase-stem ${selectedStemId === stem.id ? 'is-selected' : ''}`}
            style={{
              left: `${position.left}%`,
              bottom: `calc(${position.mouth}% + ${stem.heightOffset}px)`,
              transform: `translateX(-50%) rotate(${stem.angle}deg)`,
              zIndex: position.layer + 3,
              '--stem-extension': `${Math.max(0, stem.heightOffset)}px`,
            } as CSSProperties}
            onClick={() => setSelectedStemId(stem.id)}
            onPointerDown={event => { pressY.current = event.clientY; setDraggedStemId(stem.id); setSelectedStemId(stem.id); event.currentTarget.setPointerCapture(event.pointerId); }}
            onPointerMove={event => {
              if (draggedStemId !== stem.id || !event.buttons) return;
              const heightOffset = Math.max(-34, Math.min(36, (pressY.current - event.clientY) / 2));
              update({ ...stem, heightOffset });
            }}
            onPointerUp={() => setDraggedStemId(null)}
            onPointerCancel={() => setDraggedStemId(null)}
            aria-label={`编辑${flowerById(stem.flowerId).name}，上下拖动调整高度`}
          >
            <Flower id={stem.flowerId} size={154} stem state={stem.stage} />
          </button>;
        })}
        <Vase part="front" />
      </div>
    </section>

    <section className="vase-letter-controls" aria-live="polite">
      {selectedStem ? <>
        <p><b>{flowerById(selectedStem.flowerId).name}</b><span>已插入花瓶 · 上下拖动调整高低</span></p>
        <div className="vase-stem-actions">
          <div className="vase-stage-switcher" aria-label="调整花枝状态">
            {bouquetStages.map(stage => <button key={stage} type="button" className={selectedStem.stage === stage ? 'is-active' : ''} onClick={() => changeSelectedStage(stage)}>{stage === 'bud' ? '含苞' : stage === 'half-open' ? '半开' : '盛放'}</button>)}
          </div>
          <div className="vase-motion-actions"><button type="button" onClick={() => rotateSelected(-7)}>向左转</button><button type="button" onClick={() => rotateSelected(7)}>向右转</button><button type="button" className="vase-remove" onClick={removeSelected}>移除</button></div>
        </div>
      </> : <p className="vase-letter-tip">选择花信加入花瓶；点选花枝后，可拖动、转向或移除。</p>}
      <strong>{data.bouquet.length} / {MAX_VASE_STEMS} 枝{isFull ? ' · 花瓶已满' : ''}</strong>
    </section>

    <FlowerLetterTray ownedIds={data.discoveredFlowerIds} stemCount={data.bouquet.length} maxStems={MAX_VASE_STEMS} onPick={add} />
  </main>;
}
