import type { CSSProperties } from 'react';
import { flowers } from '../data/flowers';
import { OptimizedImage } from './OptimizedImage';

type FlowerLetterTrayProps = {
  ownedIds: string[];
  stemCount: number;
  maxStems: number;
  onPick: (flowerId: string) => void;
};

export function FlowerLetterTray({ ownedIds, stemCount, maxStems, onPick }: FlowerLetterTrayProps) {
  const availableFlowers = flowers.filter(flower => ownedIds.includes(flower.id));
  const isFull = stemCount >= maxStems;

  return <section className="flower-letter-tray" aria-labelledby="flower-letter-title">
    <div className="flower-letter-tray__head">
      <div>
        <h2 id="flower-letter-title">选一封花信</h2>
      </div>
      <span className="flower-letter-tray__count">{stemCount} / {maxStems}</span>
    </div>
    {availableFlowers.length ? <div className="flower-letter-tray__track">
      {availableFlowers.map(flower => <button
        key={flower.id}
        type="button"
        className="flower-letter"
        disabled={isFull}
        onClick={() => onPick(flower.id)}
        aria-label={isFull ? `花瓶已满，无法加入${flower.name}` : `将${flower.name}加入花瓶`}
        style={{ '--letter-tint': flower.colors[0], '--letter-light': flower.colors[1] } as CSSProperties}
      >
        <span className="flower-letter__tab" aria-hidden="true" />
        <span className="flower-letter__preview" aria-hidden="true"><OptimizedImage src={flower.assets.bloom} fallbackSrc={flower.assetFallbacks.bloom} alt="" draggable={false} /></span>
        <span className="flower-letter__face" aria-hidden="true" />
        <span className="flower-letter__copy"><span>花信 · {flower.meaning}</span><strong>{flower.name}</strong></span>
        <span className="flower-letter__add" aria-hidden="true">{isFull ? '—' : '＋'}</span>
      </button>)}
    </div> : <p className="flower-letter-tray__empty">水池里还没有可取用的花信。</p>}
  </section>;
}
