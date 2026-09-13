import { flowerById } from '../data/flowers';
import { VASE_ASSET, VASE_BACKGROUND_ASSET, vaseStemSlots } from '../data/vase';
import type { BouquetStem } from '../types';

type Rect = { left: number; top: number; width: number; height: number; right: number; bottom: number };

const asRect = (rect: DOMRect, root: DOMRect): Rect => ({
  left: rect.left - root.left,
  top: rect.top - root.top,
  right: rect.right - root.left,
  bottom: rect.bottom - root.top,
  width: rect.width,
  height: rect.height,
});

const loadImage = (source: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  // All art is served from the same GitHub Pages origin. Setting this up front
  // also keeps the canvas export safe when a custom domain is added later.
  image.crossOrigin = 'anonymous';
  image.onload = async () => {
    try {
      await image.decode?.();
      resolve(image);
    } catch {
      resolve(image);
    }
  };
  image.onerror = () => reject(new Error(`无法加载导出素材：${source}`));
  image.src = source;
});

const px = (value: string, fallback: number) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const findStemElement = (root: HTMLElement, stemId: string) => (
  Array.from(root.querySelectorAll<HTMLElement>('[data-vase-stem-id]'))
    .find(element => element.dataset.vaseStemId === stemId) ?? null
);

const drawCover = (context: CanvasRenderingContext2D, image: CanvasImageSource, targetWidth: number, targetHeight: number) => {
  const source = image as HTMLImageElement;
  const scale = Math.max(targetWidth / source.naturalWidth, targetHeight / source.naturalHeight);
  const width = source.naturalWidth * scale;
  const height = source.naturalHeight * scale;
  context.drawImage(image, (targetWidth - width) / 2, 0, width, height);
};

const drawVeil = (context: CanvasRenderingContext2D, width: number, height: number) => {
  const veil = context.createLinearGradient(0, 0, 0, height);
  veil.addColorStop(0, 'rgba(6, 31, 44, .28)');
  veil.addColorStop(.36, 'rgba(9, 37, 48, .09)');
  veil.addColorStop(.76, 'rgba(6, 27, 39, .53)');
  veil.addColorStop(1, 'rgba(4, 23, 32, .79)');
  context.fillStyle = veil;
  context.fillRect(0, 0, width, height);
};

const drawHalo = (context: CanvasRenderingContext2D, rect: Rect) => {
  const halo = context.createRadialGradient(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
    0,
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
    Math.max(rect.width, rect.height) / 2,
  );
  halo.addColorStop(0, 'rgba(233, 246, 229, .30)');
  halo.addColorStop(.34, 'rgba(154, 200, 216, .21)');
  halo.addColorStop(.72, 'rgba(154, 200, 216, 0)');
  context.fillStyle = halo;
  context.beginPath();
  context.ellipse(rect.left + rect.width / 2, rect.top + rect.height / 2, rect.width / 2, rect.height / 2, 0, 0, Math.PI * 2);
  context.fill();
};

const drawCounter = (context: CanvasRenderingContext2D, rect: Rect) => {
  const fill = context.createLinearGradient(0, rect.top, 0, rect.bottom);
  fill.addColorStop(0, 'rgba(15, 61, 75, .40)');
  fill.addColorStop(.37, 'rgba(9, 43, 56, .43)');
  fill.addColorStop(1, 'rgba(6, 26, 37, .71)');
  context.fillStyle = fill;
  context.fillRect(rect.left, rect.top, rect.width, rect.height);

  const reflection = context.createRadialGradient(
    rect.left + rect.width / 2,
    rect.top + 3,
    0,
    rect.left + rect.width / 2,
    rect.top + 3,
    rect.width * .38,
  );
  reflection.addColorStop(0, 'rgba(201, 240, 228, .28)');
  reflection.addColorStop(.38, 'rgba(184, 228, 224, .10)');
  reflection.addColorStop(.69, 'rgba(184, 228, 224, 0)');
  context.fillStyle = reflection;
  context.fillRect(rect.left, rect.top, rect.width, rect.height);
  context.strokeStyle = 'rgba(217, 245, 239, .26)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(rect.left, rect.top + .5);
  context.lineTo(rect.right, rect.top + .5);
  context.stroke();
};

const drawVaseBack = (context: CanvasRenderingContext2D, vase: HTMLImageElement, rect: Rect) => {
  context.save();
  context.beginPath();
  context.ellipse(rect.left + rect.width / 2, rect.top + rect.height * .295, rect.width * .39, rect.height * .064, 0, 0, Math.PI * 2);
  context.clip();
  context.drawImage(vase, rect.left, rect.top, rect.width, rect.height);
  context.restore();
};

const drawVaseFront = (context: CanvasRenderingContext2D, vase: HTMLImageElement, rect: Rect) => {
  const x = rect.left;
  const y = rect.top;
  const w = rect.width;
  const h = rect.height;
  context.save();
  context.beginPath();
  context.moveTo(x, y + h * .35);
  context.lineTo(x + w * .10, y + h * .35);
  context.lineTo(x + w * .16, y + h * .33);
  context.lineTo(x + w * .22, y + h * .315);
  context.lineTo(x + w * .78, y + h * .315);
  context.lineTo(x + w * .84, y + h * .33);
  context.lineTo(x + w * .90, y + h * .35);
  context.lineTo(x + w, y + h * .35);
  context.lineTo(x + w, y + h);
  context.lineTo(x, y + h);
  context.closePath();
  context.clip();
  context.drawImage(vase, x, y, w, h);
  context.restore();
};

const drawStem = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  stem: BouquetStem,
  vessel: Rect,
  element: HTMLElement | null,
) => {
  const style = element ? getComputedStyle(element) : null;
  const slot = vaseStemSlots[stem.slot] ?? vaseStemSlots[0];
  const width = style ? px(style.width, 154) : 154;
  const height = style ? px(style.height, 154) : 154;
  const left = style ? px(style.left, vessel.width * slot.left / 100) : vessel.width * slot.left / 100;
  const bottom = style ? px(style.bottom, vessel.height * slot.mouth / 100 + stem.heightOffset) : vessel.height * slot.mouth / 100 + stem.heightOffset;
  const anchorX = vessel.left + left;
  const anchorY = vessel.bottom - bottom;

  context.save();
  context.translate(anchorX, anchorY);
  context.rotate(stem.angle * Math.PI / 180);
  if (stem.heightOffset > 0) {
    const extension = context.createLinearGradient(0, 0, 0, stem.heightOffset);
    extension.addColorStop(0, '#7eaf68');
    extension.addColorStop(1, '#416f4e');
    context.fillStyle = extension;
    context.fillRect(-1, 0, 2, stem.heightOffset);
  }
  context.translate(-width / 2, -height);
  context.shadowColor = 'rgba(6, 28, 39, .40)';
  context.shadowBlur = 4;
  context.shadowOffsetY = 5;
  context.drawImage(image, 0, 0, width, height);
  context.restore();
};

const download = (canvas: HTMLCanvasElement) => new Promise<void>((resolve, reject) => {
  canvas.toBlob(blob => {
    if (!blob) {
      reject(new Error('无法生成 PNG 文件'));
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `花信花瓶-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    resolve();
  }, 'image/png');
});

/**
 * Paints the share image ourselves rather than screenshotting the DOM. It makes
 * the result deterministic, leaves all editor controls out, and avoids adding a
 * DOM-to-image dependency. The app art is same-origin so every source stays
 * readable by the canvas on GitHub Pages.
 */
export async function exportVaseImage(root: HTMLElement, bouquet: BouquetStem[]) {
  const vesselElement = root.querySelector<HTMLElement>('.vase-letter-vessel');
  const stageElement = root.querySelector<HTMLElement>('.vase-letter-stage');
  const counterElement = root.querySelector<HTMLElement>('.vase-letter-counter');
  const haloElement = root.querySelector<HTMLElement>('.vase-letter-halo');
  if (!vesselElement || !stageElement || !counterElement || !haloElement) {
    throw new Error('花瓶画面尚未准备好');
  }

  const rootRect = root.getBoundingClientRect();
  const navRect = root.parentElement?.querySelector<HTMLElement>('.bottom-nav')?.getBoundingClientRect();
  const visibleHeight = Math.max(1, Math.min(rootRect.height, navRect ? navRect.top - rootRect.top : rootRect.height));
  const renderScale = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(rootRect.width * renderScale);
  canvas.height = Math.round(visibleHeight * renderScale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器不支持图片导出');
  context.scale(renderScale, renderScale);

  const flowerSources = bouquet.map(stem => {
    const displayed = findStemElement(root, stem.id)?.querySelector<HTMLImageElement>('img');
    return displayed?.currentSrc || flowerById(stem.flowerId).assets[stem.stage];
  });
  // Keep these loads explicitly ordered. A just-mounted <img> can have an
  // empty currentSrc; its src attribute (or the known default) is still a
  // valid backdrop and must never shift the flower image list.
  const backdropElement = root.querySelector<HTMLImageElement>('.vase-letter-backdrop');
  const backdropSource = backdropElement?.currentSrc || backdropElement?.src || VASE_BACKGROUND_ASSET;
  const [vase, backdrop, ...flowerImages] = await Promise.all([
    loadImage(VASE_ASSET),
    loadImage(backdropSource),
    ...flowerSources.map(loadImage),
  ]);
  const flowerImageByStem = new Map(bouquet.map((stem, index) => [stem.id, flowerImages[index]]));

  drawCover(context, backdrop, rootRect.width, rootRect.height);
  drawVeil(context, rootRect.width, rootRect.height);

  const stage = asRect(stageElement.getBoundingClientRect(), rootRect);
  const vessel = asRect(vesselElement.getBoundingClientRect(), rootRect);
  const counter = asRect(counterElement.getBoundingClientRect(), rootRect);
  const halo = asRect(haloElement.getBoundingClientRect(), rootRect);
  context.save();
  context.beginPath();
  context.rect(stage.left, stage.top, stage.width, stage.height);
  context.clip();
  drawHalo(context, halo);
  drawCounter(context, counter);
  drawVaseBack(context, vase, vessel);

  const orderedStems = bouquet
    .map(stem => ({
      stem,
      image: flowerImageByStem.get(stem.id),
      element: findStemElement(root, stem.id),
    }))
    .filter((item): item is { stem: BouquetStem; image: HTMLImageElement; element: HTMLElement | null } => Boolean(item.image))
    .sort((a, b) => {
      const aZ = a.element ? px(getComputedStyle(a.element).zIndex, 0) : (vaseStemSlots[a.stem.slot]?.layer ?? 0);
      const bZ = b.element ? px(getComputedStyle(b.element).zIndex, 0) : (vaseStemSlots[b.stem.slot]?.layer ?? 0);
      return aZ - bZ;
    });
  orderedStems.forEach(({ stem, image, element }) => drawStem(context, image, stem, vessel, element));
  drawVaseFront(context, vase, vessel);
  context.restore();

  await download(canvas);
}
