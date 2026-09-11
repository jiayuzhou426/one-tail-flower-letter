import './SpringPondFrame.css';
import { WaterRippleField } from './WaterRippleField';

const pondImage = `${import.meta.env.BASE_URL}assets/explore/concepts/spring-pond-standard-frame-approved.png`;
const pondWaterMask = `${import.meta.env.BASE_URL}assets/explore/concepts/spring-pond-water-mask.svg`;

/**
 * A deliberately static art-direction checkpoint. It is isolated behind
 * ?springPondPreview=1 so it cannot alter the shipped exploration loop while
 * the new water-rendering and leaf-bank direction is being reviewed.
 */
export function SpringPondFrame() {
  const showWaterMask = new URLSearchParams(window.location.search).get('springPondMask') === '1';

  return (
    <main className="spring-frame-shell" aria-label="春水池塘静态视觉标准帧">
      <section className="spring-frame">
        <img
          className="spring-frame__art"
          src={pondImage}
          alt="由层叠荷叶围出蜿蜒水路的春日池塘"
        />
        <WaterRippleField
          className="spring-frame__water"
          imageSrc={pondImage}
          maskSrc={pondWaterMask}
          fishX={.51}
          fishY={.632}
          fishWake
        />
        {showWaterMask && (
          <img
            className="spring-frame__mask-guide"
            src={pondWaterMask}
            alt="水波可传播区域：白色为可游水面，黑色为荷叶与花朵边界"
          />
        )}
        <img
          className="spring-frame__fish"
          src={`${import.meta.env.BASE_URL}assets/explore/final/fish/fish-3.png`}
          alt="由水形成、朝上游动的小鱼（WebGL 不可用时的静态版本）"
        />
      </section>
    </main>
  );
}
