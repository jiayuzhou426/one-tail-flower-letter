import { VASE_ASSET } from '../data/vase';

export function Vase({ part = 'front' }: { part?: 'front' | 'back' }) {
  const isFront = part === 'front';
  return <img
    className={`vase vase-asset vase-${part}`}
    src={VASE_ASSET}
    alt={isFront ? '雾蓝玻璃花瓶' : ''}
    aria-hidden={isFront ? undefined : true}
    draggable={false}
  />;
}
