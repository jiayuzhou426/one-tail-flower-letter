import { useState, type CSSProperties, type PointerEvent } from 'react';
import { useGame } from '../GameContext';
import { collectionPondSlots } from '../data/collectionPond';
import { flowerById, flowers } from '../data/flowers';
import { PondWaterCanvas, type PondWaterPulse } from '../components/PondWaterCanvas';
import { WaterRippleField } from '../components/WaterRippleField';

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const sceneAsset = publicAsset('assets/pond/collection-pond-scene-v1.png');
const waterMaskAsset = publicAsset('assets/pond/collection-pond-water-mask-v1.svg');

export function PondPage({ openArrange }: { openArrange: () => void }) {
  const { data, plantInPond } = useGame();
  const [drawer, setDrawer] = useState(false);
  const [newFlower, setNewFlower] = useState<string | null>(null);
  const [waterPulses, setWaterPulses] = useState<PondWaterPulse[]>([]);
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const seed = data.pendingSeed;
  const seedFlower = seed ? flowerById(seed.flowerId) : null;
  const plantsBySlot = new Map(data.pondPlants.map(plant => [plant.slotId, plant]));

  const addWaterPulse = (left: number, top: number, options: Pick<PondWaterPulse, 'radius' | 'strength'>) => {
    setWaterPulses(current => [...current.slice(-7), { id: crypto.randomUUID(), left, top, ...options }]);
  };

  const plant = (slotId: string) => {
    if (!seed) return;
    const slot = collectionPondSlots.find(item => item.id === slotId);
    if (slot) addWaterPulse(slot.left, slot.top, { radius: 28, strength: .13 });
    plantInPond(slotId);
    setNewFlower(seed.flowerId);
    window.setTimeout(() => setNewFlower(null), 2600);
  };

  const rippleAt = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const left = ((event.clientX - bounds.left) / bounds.width) * 100;
    const top = ((event.clientY - bounds.top) / bounds.height) * 100;
    if (top < 34 || top > 92) return;
    addWaterPulse(left, top, { radius: 24, strength: .105 });
  };

  return <main className="pond collection-pond page">
    <div className="collection-scene">
      <img className="collection-backdrop" src={sceneAsset} alt="花店旁清澈的收藏水池" />
      <WaterRippleField
        className="collection-water-webgl"
        imageSrc={sceneAsset}
        maskSrc={waterMaskAsset}
        pulses={waterPulses}
        interactive={false}
        showFish={false}
        objectPosition="top"
        onReady={() => setWebglUnavailable(false)}
        onUnavailable={() => setWebglUnavailable(true)}
      />
      <div className="collection-vignette" />
      {webglUnavailable && <PondWaterCanvas pulses={waterPulses} blockedAreas={collectionPondSlots} />}

      <header className="collection-head">
        <div>
          <p className="eyebrow">收藏水池</p>
          <p>已安放 <b>{data.pondPlants.length}</b> / {flowers.length} 朵花信</p>
        </div>
        <button className="collection-book" onClick={() => setDrawer(true)} aria-label="打开花信图鉴">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h11v16H5zM8 7h5M8 11h5M8 15h4" /></svg>
        </button>
      </header>

      <div className="collection-progress" aria-label={`已收藏 ${data.pondPlants.length} 种花`}>
        {flowers.map(flower => <i key={flower.id} className={data.pondPlants.some(plant => plant.flowerId === flower.id) ? 'is-filled' : ''} />)}
      </div>

      <div className="collection-water" aria-label="收藏水位" onPointerDown={rippleAt}>
        {collectionPondSlots.map(slot => {
          const pondPlant = plantsBySlot.get(slot.id);
          const flower = pondPlant ? flowerById(pondPlant.flowerId) : null;
          const selectable = Boolean(seed && !pondPlant);
          const slotStyle = {
            left: `${slot.left}%`,
            top: `${slot.top}%`,
            '--cluster-width': `${slot.width}px`,
            '--cluster-height': `${Math.round(slot.width * 2 / 3)}px`,
            '--slot-rotation': `${slot.rotation}deg`,
            '--slot-depth': String(slot.depth),
          } as CSSProperties;
          return <button
            key={slot.id}
            type="button"
            className={`collection-slot ${pondPlant ? 'is-planted' : ''} ${selectable ? 'is-selectable' : ''}`}
            style={slotStyle}
            disabled={!selectable}
            onPointerDown={event => event.stopPropagation()}
            onClick={() => plant(slot.id)}
            aria-label={pondPlant ? `${flower!.name} 已安放` : selectable ? `在此安放 ${seedFlower!.name}` : '空水位'}
          >
            <span className="collection-slot-glow" />
            {pondPlant && flower
              ? <img className="collection-cluster" src={flower.pondClusterAsset} alt={flower.name} style={{ '--pond-scale': String(flower.pondScale) } as CSSProperties} draggable={false} />
              : selectable ? <span className="collection-empty-mark">＋</span> : null}
          </button>;
        })}
      </div>

      <section className={`collection-caption ${seed ? 'has-seed' : ''}`}>
        {seed && seedFlower
          ? <><span>新的花信</span><strong>{seedFlower.name}</strong><p>选择一处水面，让它留在这里。</p></>
          : data.pondPlants.length === flowers.length
            ? <><span>五次远游，五朵花信</span><p>水面已经记住每一次归来。</p></>
            : <><span>水面仍在等候</span><p>下一次远游，会带回一朵新花。</p></>}
      </section>

      <button className="collection-arrange-link" onClick={openArrange}>去花瓶看看 <span>→</span></button>
    </div>

    {drawer && <div className="modal-back" onClick={() => setDrawer(false)}>
      <aside className="catalog collection-catalog" onClick={event => event.stopPropagation()}>
        <button className="close" onClick={() => setDrawer(false)} aria-label="关闭图鉴">×</button>
        <p className="eyebrow">花信图鉴</p>
        <h2>留在水里的花</h2>
        {flowers.map(flower => {
          const pondPlant = data.pondPlants.find(plant => plant.flowerId === flower.id);
          return <article className={`catalog-row ${pondPlant ? '' : 'locked'}`} key={flower.id}>
            <img className="catalog-cluster" src={flower.pondClusterAsset} alt="" />
            <div><b>{pondPlant ? flower.name : '尚未抵达'}</b><small>{pondPlant ? `${flower.meaning} · ${flower.rarity}` : '等待下一次远游'}</small></div>
            {pondPlant && <em>已安放</em>}
          </article>;
        })}
      </aside>
    </div>}

    {newFlower && <section className="collection-toast" aria-live="polite">
      <img className="collection-toast-cluster" src={flowerById(newFlower).pondClusterAsset} alt="" />
      <div><p>已安放在水中</p><strong>{flowerById(newFlower).name}</strong></div>
    </section>}
  </main>;
}
