import { flowerById } from '../data/flowers';
import type { FlowerStage } from '../types';
import { OptimizedImage } from './OptimizedImage';

export function Flower({
  id,
  size = 64,
  stem = false,
  className = '',
  growing = false,
  state = 'bloom',
}: {
  id: string;
  size?: number;
  stem?: boolean;
  className?: string;
  growing?: boolean;
  state?: FlowerStage;
}) {
  const flower = flowerById(id);
  return <OptimizedImage
    className={`flower flower-asset ${stem ? 'has-stem' : 'is-head'} ${growing ? 'is-growing' : ''} ${className}`}
    src={flower.assets[state]}
    fallbackSrc={flower.assetFallbacks[state]}
    alt={flower.name}
    width={size}
    height={size}
    draggable={false}
  />;
}
