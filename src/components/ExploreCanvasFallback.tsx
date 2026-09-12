import { useEffect, useRef } from 'react';

type ExploreCanvasFallbackProps = {
  imageSrc: string;
  durationMs: number;
  fishX: number;
  fishY: number;
  active: boolean;
  onComplete: () => void;
};

type FallbackRipple = {
  x: number;
  y: number;
  bornAt: number;
  duration: number;
  radius: number;
  rings: number;
};

/**
 * A lightweight safety net for browsers that reject the WebGL scene. It is
 * always drawn underneath the GPU canvas, so an older or memory-constrained
 * phone still gets the moving map, a controllable fish and natural ripples.
 */
export function ExploreCanvasFallback({ imageSrc, durationMs, fishX, fishY, active, onComplete }: ExploreCanvasFallbackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active) return undefined;
    const context = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !context) return undefined;

    let disposed = false;
    let raf = 0;
    let startedAt = performance.now();
    let lastTime = startedAt;
    let ambientAt = startedAt + 450;
    let completed = false;
    let pointerDown = false;
    let currentX = fishX;
    let targetX = fishX;
    let velocityX = 0;
    const ripples: FallbackRipple[] = [];
    const image = new Image();

    const addRipple = (x: number, y: number, radius = 42) => {
      ripples.push({
        x,
        y,
        bornAt: performance.now(),
        duration: 1150 + Math.random() * 650,
        radius: radius * (.84 + Math.random() * .32),
        rings: 2 + Math.floor(Math.random() * 2),
      });
      if (ripples.length > 10) ripples.splice(0, ripples.length - 10);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      return rect;
    };

    const pointFromEvent = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / Math.max(rect.width, 1),
        y: (event.clientY - rect.top) / Math.max(rect.height, 1),
      };
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerDown = true;
      const point = pointFromEvent(event);
      targetX = Math.max(.07, Math.min(.93, point.x));
      addRipple(point.x, point.y, 34);
      canvas.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointerDown && event.pointerType !== 'mouse') return;
      const point = pointFromEvent(event);
      targetX = Math.max(.07, Math.min(.93, point.x));
      if (pointerDown && Math.random() < .28) addRipple(point.x, point.y, 25);
    };

    const onPointerEnd = (event: PointerEvent) => {
      pointerDown = false;
      if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };

    const drawFish = (width: number, height: number, now: number) => {
      const x = currentX * width;
      const y = fishY * height;
      const length = Math.max(42, Math.min(52, width * .125));
      const bend = Math.max(-1, Math.min(1, velocityX * 2.4));
      const sway = Math.sin(now * .006) * 2.4;
      context.save();
      context.translate(x, y);
      context.rotate(bend * .18);
      context.beginPath();
      context.moveTo(0, -length * .52);
      context.bezierCurveTo(-length * .19, -length * .38, -length * .16 + sway * .1, length * .08, -length * .07 + bend * 3, length * .31);
      context.bezierCurveTo(-length * .2 + sway, length * .39, -length * .2 + sway, length * .51, -length * .04, length * .45);
      context.quadraticCurveTo(0, length * .39, length * .04, length * .45);
      context.bezierCurveTo(length * .2 + sway, length * .51, length * .2 + sway, length * .39, length * .07 + bend * 3, length * .31);
      context.bezierCurveTo(length * .16 + sway * .1, length * .08, length * .19, -length * .38, 0, -length * .52);
      const fill = context.createLinearGradient(0, -length * .5, 0, length * .5);
      fill.addColorStop(0, 'rgba(192,238,255,.92)');
      fill.addColorStop(.46, 'rgba(61,151,224,.82)');
      fill.addColorStop(1, 'rgba(91,188,235,.46)');
      context.fillStyle = fill;
      context.fill();
      context.lineWidth = 1.7;
      context.strokeStyle = 'rgba(250,255,255,.94)';
      context.stroke();
      context.restore();
    };

    const draw = (now: number) => {
      if (disposed || !image.complete || !image.naturalWidth) return;
      const rect = resize();
      const width = rect.width;
      const height = rect.height;
      const delta = Math.min(.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;
      const progress = Math.min(1, Math.max(0, (now - startedAt) / Math.max(durationMs, 1)));
      const displayAspect = width / Math.max(height, 1);
      const sourceAspect = image.naturalWidth / image.naturalHeight;

      if (displayAspect > sourceAspect) {
        const sourceHeight = image.naturalWidth / displayAspect;
        const sourceY = (image.naturalHeight - sourceHeight) * (1 - progress);
        context.drawImage(image, 0, sourceY, image.naturalWidth, sourceHeight, 0, 0, width, height);
      } else {
        const sourceWidth = image.naturalHeight * displayAspect;
        const sourceX = (image.naturalWidth - sourceWidth) * .5;
        context.drawImage(image, sourceX, 0, sourceWidth, image.naturalHeight, 0, 0, width, height);
      }

      const desiredVelocity = (targetX - currentX) * 4.4;
      velocityX += (desiredVelocity - velocityX) * Math.min(1, delta * 6.5);
      currentX = Math.max(.06, Math.min(.94, currentX + velocityX * delta));

      if (now >= ambientAt) {
        ambientAt = now + 1700 + Math.random() * 1900;
        addRipple(.12 + Math.random() * .76, .1 + Math.random() * .74, 38 + Math.random() * 24);
      }

      for (let index = ripples.length - 1; index >= 0; index -= 1) {
        const ripple = ripples[index];
        const life = (now - ripple.bornAt) / ripple.duration;
        if (life >= 1) {
          ripples.splice(index, 1);
          continue;
        }
        const eased = 1 - (1 - life) * (1 - life);
        context.save();
        context.translate(ripple.x * width, ripple.y * height);
        context.lineWidth = 1.1;
        for (let ring = 0; ring < ripple.rings; ring += 1) {
          const ringLife = Math.max(0, Math.min(1, life - ring * .09));
          const radius = ripple.radius * (.18 + eased * .82) * (1 - ring * .14);
          context.beginPath();
          context.ellipse(0, 0, radius, radius * .38, 0, 0, Math.PI * 2);
          context.strokeStyle = `rgba(255,255,255,${Math.max(0, (1 - ringLife) * .46 - ring * .07)})`;
          context.stroke();
        }
        context.restore();
      }

      drawFish(width, height, now);
      canvas.dataset.ready = 'true';

      if (progress >= 1 && !completed) {
        completed = true;
        onCompleteRef.current();
        return;
      }
      raf = requestAnimationFrame(draw);
    };

    image.onload = () => {
      if (disposed) return;
      startedAt = performance.now();
      lastTime = startedAt;
      raf = requestAnimationFrame(draw);
    };
    image.onerror = () => delete canvas.dataset.ready;
    image.src = imageSrc;

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerEnd);
    canvas.addEventListener('pointercancel', onPointerEnd);
    canvas.addEventListener('pointerleave', onPointerEnd);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      image.onload = null;
      image.onerror = null;
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerEnd);
      canvas.removeEventListener('pointercancel', onPointerEnd);
      canvas.removeEventListener('pointerleave', onPointerEnd);
    };
  }, [active, durationMs, fishX, fishY, imageSrc]);

  return <canvas ref={canvasRef} className="explore-fallback-canvas" aria-label="兼容模式春水池塘" />;
}
