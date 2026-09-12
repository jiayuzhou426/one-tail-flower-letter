import { useEffect, useRef } from 'react';
import { RippleSystem } from '../game/explore/rippleSystem';

export type PondWaterPulse = {
  id: string;
  left: number;
  top: number;
  radius?: number;
  strength?: number;
};
export type PondBlockedArea = { left: number; top: number; width: number };

export function PondWaterCanvas({ pulses, blockedAreas }: { pulses: PondWaterPulse[]; blockedAreas: readonly PondBlockedArea[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef(new RippleSystem());
  const seenPulseIds = useRef(new Set<string>());
  const queuedPulses = useRef<PondWaterPulse[]>([]);
  const blockedRef = useRef(blockedAreas);
  blockedRef.current = blockedAreas;

  useEffect(() => {
    for (const pulse of pulses) {
      if (seenPulseIds.current.has(pulse.id)) continue;
      seenPulseIds.current.add(pulse.id);
      queuedPulses.current.push(pulse);
    }
    const currentIds = new Set(pulses.map(pulse => pulse.id));
    for (const id of seenPulseIds.current) if (!currentIds.has(id)) seenPulseIds.current.delete(id);
  }, [pulses]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const output = canvas?.getContext('2d');
    if (!canvas || !output) return undefined;
    let animation = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      output.setTransform(dpr, 0, 0, dpr, 0, 0);
      output.imageSmoothingEnabled = true;
    };

    const draw = (now: number) => {
      const dt = Math.min(0.033, Math.max(0, (now - last) / 1000));
      last = now;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width > 0 && height > 0) {
        while (queuedPulses.current.length) {
          const pulse = queuedPulses.current.shift()!;
          ripplesRef.current.add(width * pulse.left / 100, height * pulse.top / 100, { life: 1.08, size: 6, rings: 2 });
        }
        const openWater = (x: number, y: number) => {
          if (y < height * .34 || y > height * .92) return false;
          return !blockedRef.current.some(area => {
            const centerX = width * area.left / 100;
            const centerY = height * area.top / 100;
            const dx = (x - centerX) / Math.max(28, area.width * .48);
            const dy = (y - centerY) / Math.max(16, area.width * .27);
            return dx * dx + dy * dy < 1;
          });
        };
        output.clearRect(0, 0, width, height);
        ripplesRef.current.update(dt, width, height, openWater);
        for (const ripple of ripplesRef.current.ripples) {
          const phase = ripple.age / ripple.life;
          const fade = (1 - phase) * (.42 + Math.sin(phase * Math.PI) * .22);
          output.strokeStyle = `rgba(239,255,255,${fade})`;
          output.lineWidth = .7 + phase * .25;
          for (let ring = 0; ring < ripple.rings; ring += 1) {
            const delay = ring * .08;
            const spread = Math.max(0, (phase - delay) / (1 - delay));
            const radius = ripple.size + spread * (16 + ring * 9);
            output.beginPath();
            output.ellipse(ripple.x, ripple.y, radius, radius * (.27 + ring * .025), 0, 0, Math.PI * 2);
            output.stroke();
          }
          if (phase < .24) {
            output.fillStyle = `rgba(247,255,255,${(.24 - phase) * 1.6})`;
            output.beginPath();
            output.ellipse(ripple.x, ripple.y, 1.25, .7, 0, 0, Math.PI * 2);
            output.fill();
          }
        }
      }
      animation = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    animation = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animation);
    };
  }, []);

  return <canvas ref={canvasRef} className="pond-water-canvas" aria-hidden="true" />;
}
