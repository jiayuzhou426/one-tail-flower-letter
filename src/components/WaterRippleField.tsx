import { useEffect, useRef } from 'react';

type WaterRippleFieldProps = {
  imageSrc: string;
  maskSrc: string;
  fishX?: number;
  fishY?: number;
  fishWake?: boolean;
  playable?: boolean;
  durationMs?: number;
  progressOverride?: number;
  collisionDebug?: boolean;
  onComplete?: () => void;
  className?: string;
};

type RippleDrop = {
  x: number;
  y: number;
  radius: number;
  strength: number;
};

type RenderTarget = {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
};

const COLLISION_MASK_CUTOFF = 128;

const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = vec2(aPosition.x * .5 + .5, .5 - aPosition.y * .5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

// R is the current height and G is the height from the previous simulation step.
// Running this shader into alternating framebuffers makes the water a real GPU
// height field instead of an expanding DOM/CSS circle effect.
const SIMULATION_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uState;
uniform sampler2D uMask;
uniform vec2 uTexel;
uniform float uAspect;
uniform vec2 uImageScale;
uniform vec2 uImageOffset;
uniform vec4 uDrop;
uniform float uHasDrop;

// All consumers use the same binary decision: mask values at or above 50%
// are water, and values below 50% are obstacles.
const float MASK_CUTOFF = .5;

float decode(float value) {
  return (value - .5019608) * 2.0;
}

float encode(float value) {
  return clamp(value * .5 + .5019608, 0.0, 1.0);
}

vec2 coverUv(vec2 uv) {
  return uv * uImageScale + uImageOffset;
}

// Fragment coordinates point down from the top, whereas a texture rendered
// through a framebuffer is sampled from the bottom. Keep all pointer drops
// in screen-space by flipping only the state-texture lookup.
vec2 stateUv(vec2 uv) {
  return vec2(uv.x, 1.0 - uv.y);
}

void main() {
  float water = step(MASK_CUTOFF, texture2D(uMask, coverUv(vUv)).r);
  float previous = decode(texture2D(uState, stateUv(vUv)).g);
  float left = decode(texture2D(uState, stateUv(vUv - vec2(uTexel.x, 0.0))).r);
  float right = decode(texture2D(uState, stateUv(vUv + vec2(uTexel.x, 0.0))).r);
  float up = decode(texture2D(uState, stateUv(vUv - vec2(0.0, uTexel.y))).r);
  float down = decode(texture2D(uState, stateUv(vUv + vec2(0.0, uTexel.y))).r);

  float next = ((left + right + up + down) * .5 - previous) * .992;
  if (uHasDrop > .5) {
    vec2 fromDrop = vUv - uDrop.xy;
    fromDrop.x *= uAspect;
    float distanceFromDrop = length(fromDrop) / max(uDrop.z, .0001);
    float falloff = cos(clamp(distanceFromDrop, 0.0, 1.0) * 1.5707963);
    next += uDrop.w * falloff * falloff * step(distanceFromDrop, 1.0);
  }

  // The same hand-shaped water mask also absorbs waves at leaf banks, so a
  // ripple cannot visibly travel beneath a flower or over a lotus leaf.
  next *= water;
  gl_FragColor = vec4(encode(next), encode(decode(texture2D(uState, stateUv(vUv)).r) * water), .5, 1.0);
}`;

const SCENE_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uBase;
uniform sampler2D uWave;
uniform sampler2D uMask;
uniform vec2 uTexel;
uniform vec2 uImageScale;
uniform vec2 uImageOffset;
uniform vec2 uFishPosition;
uniform float uFishLength;
uniform float uFishBend;
uniform float uFishPhase;
uniform float uCollisionRadiusRatio;
uniform float uDisplayAspect;
uniform float uCollisionDebug;

const float MASK_CUTOFF = .5;

vec2 coverUv(vec2 uv) {
  return uv * uImageScale + uImageOffset;
}

vec2 stateUv(vec2 uv) {
  return vec2(uv.x, 1.0 - uv.y);
}

float heightAt(vec2 uv) {
  return (texture2D(uWave, stateUv(uv)).r - .5019608) * 2.0;
}

float softLine(float distanceToLine, float width, float feather) {
  return 1.0 - smoothstep(width, width + feather, distanceToLine);
}

void main() {
  vec2 sourceUv = coverUv(vUv);
  float waterMask = step(MASK_CUTOFF, texture2D(uMask, sourceUv).r);
  vec3 original = texture2D(uBase, sourceUv).rgb;
  float left = heightAt(vUv - vec2(uTexel.x, 0.0));
  float right = heightAt(vUv + vec2(uTexel.x, 0.0));
  float up = heightAt(vUv - vec2(0.0, uTexel.y));
  float down = heightAt(vUv + vec2(0.0, uTexel.y));
  vec2 gradient = vec2(right - left, down - up);
  float slope = length(gradient);
  float wave = abs(heightAt(vUv));

  vec2 refractedUv = clamp(vUv + gradient * .042, .002, .998);
  // Never refract an adjacent leaf bank into the water. The second mask read
  // keeps the painted shoreline intact even when a wave reaches its edge.
  vec2 refractedSourceUv = coverUv(refractedUv);
  float refractedWater = step(MASK_CUTOFF, texture2D(uMask, refractedSourceUv).r);
  vec3 color = mix(original, texture2D(uBase, refractedSourceUv).rgb, refractedWater);
  float crest = smoothstep(.018, .09, slope);
  float rippleRidge = smoothstep(.025, .105, wave) * (1.0 - smoothstep(.2, .34, wave));
  vec3 pearl = vec3(1.0, .995, .96);
  color += pearl * (crest * .13 + rippleRidge * .065);

  vec3 result = mix(original, min(color, vec3(1.0)), waterMask);
  float maskLeft = step(MASK_CUTOFF, texture2D(uMask, coverUv(vUv - vec2(uTexel.x * 1.5, 0.0))).r);
  float maskRight = step(MASK_CUTOFF, texture2D(uMask, coverUv(vUv + vec2(uTexel.x * 1.5, 0.0))).r);
  float maskUp = step(MASK_CUTOFF, texture2D(uMask, coverUv(vUv - vec2(0.0, uTexel.y * 1.5))).r);
  float maskDown = step(MASK_CUTOFF, texture2D(uMask, coverUv(vUv + vec2(0.0, uTexel.y * 1.5))).r);
  float maskEdge = step(.5, abs(maskRight - maskLeft) + abs(maskDown - maskUp));
  vec3 collisionTint = mix(vec3(.95, .24, .47), vec3(.08, .86, .78), waterMask);
  result = mix(result, collisionTint, uCollisionDebug * .24);
  result = mix(result, vec3(1.0), maskEdge * uCollisionDebug * .92);

  // The fish is a changing water volume, not a sprite: a curved centerline
  // defines two translucent contours and tapers into three short water threads.
  vec2 fish = vUv - uFishPosition;
  fish.x *= uDisplayAspect;
  fish /= max(uFishLength, .0001);
  float t = (fish.y + .5) / .9;
  float clampedT = clamp(t, 0.0, 1.0);
  float bodyRange = smoothstep(-.02, .045, t) * (1.0 - smoothstep(.95, 1.015, t));
  float turnCurve = uFishBend * clampedT * clampedT * .13;
  float swimCurve = sin(uFishPhase + clampedT * 2.8) * (.005 + .038 * clampedT * clampedT);
  float centerline = turnCurve + swimCurve;
  // Hand-sketch profile: a small rounded head grows into a short shoulder,
  // then the long torso continuously narrows toward a slim tail stalk.
  float headProgress = min(clampedT / .23, 1.0);
  float headProfile = .062 + sin(headProgress * 1.5707963) * .128;
  float torsoProfile = mix(.19, .044, smoothstep(.2, 1.0, clampedT));
  float bodyWidth = mix(headProfile, torsoProfile, smoothstep(.2, .27, clampedT));
  float sideDistance = abs(fish.x - centerline) - bodyWidth;
  float body = (1.0 - smoothstep(-.004, .018, sideDistance)) * bodyRange;
  float contour = softLine(abs(sideDistance), .009, .018) * bodyRange;
  float innerCore = 1.0 - smoothstep(bodyWidth * .16, max(bodyWidth * .72, .006), abs(fish.x - centerline));
  float shimmer = .5 + .5 * sin(uFishPhase * .72 + clampedT * 7.4);
  float currentBand = .5 + .5 * sin(uFishPhase * .48 + clampedT * 9.2 + (fish.x - centerline) * 8.0);
  float fillTone = clamp(.16 + innerCore * .38 + shimmer * .12 + currentBand * .2, 0.0, 1.0);
  vec3 waterBlue = mix(vec3(.08, .46, .82), vec3(.58, .92, 1.0), fillTone);
  // Two slim pectoral fins sweep backward from the body. Their curved strips
  // share the body's bend but keep a softer edge and lower opacity.
  float finT = (fish.y + .31) / .23;
  float finRange = smoothstep(-.02, .08, finT) * (1.0 - smoothstep(.88, 1.02, finT));
  float finProgress = clamp(finT, 0.0, 1.0);
  float finCenterline = uFishBend * .03 + sin(uFishPhase * .72 + 1.2) * .012;
  float finFlutter = sin(uFishPhase * .82 + finProgress * 2.4) * .022;
  float finReach = .135 + sin(finProgress * 3.1415926) * .14;
  float finWidth = sin(finProgress * 3.1415926) * .062 + (1.0 - finProgress) * .03;
  float leftFinAxis = finCenterline - finReach - finFlutter;
  float rightFinAxis = finCenterline + finReach + finFlutter;
  float leftFinDistance = abs(fish.x - leftFinAxis) - finWidth;
  float rightFinDistance = abs(fish.x - rightFinAxis) - finWidth;
  float fins = max(
    1.0 - smoothstep(-.002, .018, leftFinDistance),
    1.0 - smoothstep(-.002, .018, rightFinDistance)
  ) * finRange;
  float finContour = max(
    softLine(abs(leftFinDistance), .008, .018),
    softLine(abs(rightFinDistance), .008, .018)
  ) * finRange;

  // The forked tail is built from two diverging water lobes rather than a
  // triangle, so it remains light and organic while still reading as a fish.
  float tailT = (fish.y - .31) / .31;
  float tailRange = smoothstep(-.025, .045, tailT) * (1.0 - smoothstep(.92, 1.02, tailT));
  float tailProgress = clamp(tailT, 0.0, 1.0);
  float tailBase = uFishBend * .09 + sin(uFishPhase + 2.45) * .04;
  float tailSweep = uFishBend * .065 * tailProgress + sin(uFishPhase + tailProgress * 2.1) * .03;
  float leftTailWidth = sin(tailProgress * 3.1415926) * .09 + (1.0 - tailProgress) * .025;
  float rightTailWidth = sin(tailProgress * 3.1415926) * .068 + (1.0 - tailProgress) * .023;
  float leftTailAxis = tailBase + tailSweep - .155 * tailProgress;
  float rightTailAxis = tailBase + tailSweep + .125 * tailProgress;
  float leftTailDistance = abs(fish.x - leftTailAxis) - leftTailWidth;
  float rightTailDistance = abs(fish.x - rightTailAxis) - rightTailWidth;
  float tailUnionDistance = min(leftTailDistance, rightTailDistance);
  float tail = (1.0 - smoothstep(-.003, .018, tailUnionDistance)) * tailRange;
  float tailContour = softLine(abs(tailUnionDistance), .008, .018) * tailRange;

  float fishWater = body * waterMask;
  float aura = (1.0 - smoothstep(.018, .065, max(sideDistance, 0.0))) * bodyRange * (1.0 - body * .72);
  result = mix(result, vec3(.34, .82, 1.0), aura * waterMask * .2);
  result = mix(result, vec3(.18, .68, .94), fins * waterMask * .47);
  result = mix(result, vec3(.15, .61, .9), tail * waterMask * .47);
  result = mix(result, waterBlue, fishWater * (.49 + innerCore * .12));
  // Only the outside of the united silhouette receives the white line. This
  // prevents seams where the hand-drawn shoulder, fins and tail overlap.
  float fishShape = max(body, max(fins, tail));
  float allContours = max(contour, max(finContour, tailContour));
  float outerContour = allContours * (1.0 - smoothstep(.9, .995, fishShape));
  result = mix(result, vec3(.95, .997, 1.0), outerContour * waterMask * .98);

  // A very short dissolving wake extends from the fork; it is deliberately
  // fainter than the silhouette and never grows into a screen-long ribbon.
  float wakeT = (fish.y - .59) / .2;
  float wakeRange = smoothstep(-.04, .08, wakeT) * (1.0 - smoothstep(.82, 1.0, wakeT));
  float wakeProgress = clamp(wakeT, 0.0, 1.0);
  float wakeAxis = tailBase + uFishBend * .07 * wakeProgress
    + sin(uFishPhase + wakeProgress * 2.4) * .018;
  float wakeLeft = softLine(abs(fish.x - (wakeAxis - .035 - .018 * wakeProgress)), .004, .009);
  float wakeRight = softLine(abs(fish.x - (wakeAxis + .035 + .018 * wakeProgress)), .004, .009);
  float wakeThreads = (wakeLeft + wakeRight) * .5 * wakeRange * (1.0 - wakeProgress) * waterMask;
  result = mix(result, vec3(.58, .92, 1.0), wakeThreads * .58);

  float safeRing = softLine(abs(length(fish) - uCollisionRadiusRatio), .008, .014);
  result = mix(result, vec3(1.0, .92, .22), safeRing * uCollisionDebug * .95);

  gl_FragColor = vec4(min(result, vec3(1.0)), 1.0);
}`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, fragmentSource: string) {
  const vertex = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function createRenderTarget(gl: WebGLRenderingContext, width: number, height: number): RenderTarget | null {
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  if (!texture || !framebuffer) {
    if (texture) gl.deleteTexture(texture);
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    return null;
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteTexture(texture);
    gl.deleteFramebuffer(framebuffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return null;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { texture, framebuffer };
}

function deleteRenderTarget(gl: WebGLRenderingContext, target: RenderTarget | null) {
  if (!target) return;
  gl.deleteTexture(target.texture);
  gl.deleteFramebuffer(target.framebuffer);
}

/**
 * A WebGL height-field ripple layer for the spring pond art direction.
 * A low-resolution RG ping-pong texture advances the water on the GPU, while
 * the high-resolution fragment pass refracts only the masked waterway.
 */
export function WaterRippleField({
  imageSrc,
  maskSrc,
  fishX = .51,
  fishY = .632,
  fishWake = false,
  playable = false,
  durationMs = 20_000,
  progressOverride,
  collisionDebug = false,
  onComplete,
  className = '',
}: WaterRippleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  const progressOverrideRef = useRef(progressOverride);
  onCompleteRef.current = onComplete;
  progressOverrideRef.current = progressOverride;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    delete canvas.dataset.ready;
    let disposed = false;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) return undefined;

    const simulationProgram = createProgram(gl, SIMULATION_SHADER);
    const sceneProgram = createProgram(gl, SCENE_SHADER);
    const buffer = gl.createBuffer();
    const baseTexture = gl.createTexture();
    const maskTexture = gl.createTexture();
    if (!simulationProgram || !sceneProgram || !buffer || !baseTexture || !maskTexture) {
      if (simulationProgram) gl.deleteProgram(simulationProgram);
      if (sceneProgram) gl.deleteProgram(sceneProgram);
      if (buffer) gl.deleteBuffer(buffer);
      if (baseTexture) gl.deleteTexture(baseTexture);
      if (maskTexture) gl.deleteTexture(maskTexture);
      return undefined;
    }

    const simulationPosition = gl.getAttribLocation(simulationProgram, 'aPosition');
    const simulationState = gl.getUniformLocation(simulationProgram, 'uState');
    const simulationMask = gl.getUniformLocation(simulationProgram, 'uMask');
    const simulationTexel = gl.getUniformLocation(simulationProgram, 'uTexel');
    const simulationAspect = gl.getUniformLocation(simulationProgram, 'uAspect');
    const simulationImageScale = gl.getUniformLocation(simulationProgram, 'uImageScale');
    const simulationImageOffset = gl.getUniformLocation(simulationProgram, 'uImageOffset');
    const simulationDrop = gl.getUniformLocation(simulationProgram, 'uDrop');
    const simulationHasDrop = gl.getUniformLocation(simulationProgram, 'uHasDrop');
    const scenePosition = gl.getAttribLocation(sceneProgram, 'aPosition');
    const sceneBase = gl.getUniformLocation(sceneProgram, 'uBase');
    const sceneWave = gl.getUniformLocation(sceneProgram, 'uWave');
    const sceneMask = gl.getUniformLocation(sceneProgram, 'uMask');
    const sceneTexel = gl.getUniformLocation(sceneProgram, 'uTexel');
    const sceneImageScale = gl.getUniformLocation(sceneProgram, 'uImageScale');
    const sceneImageOffset = gl.getUniformLocation(sceneProgram, 'uImageOffset');
    const sceneFishPosition = gl.getUniformLocation(sceneProgram, 'uFishPosition');
    const sceneFishLength = gl.getUniformLocation(sceneProgram, 'uFishLength');
    const sceneFishBend = gl.getUniformLocation(sceneProgram, 'uFishBend');
    const sceneFishPhase = gl.getUniformLocation(sceneProgram, 'uFishPhase');
    const sceneCollisionRadiusRatio = gl.getUniformLocation(sceneProgram, 'uCollisionRadiusRatio');
    const sceneDisplayAspect = gl.getUniformLocation(sceneProgram, 'uDisplayAspect');
    const sceneCollisionDebug = gl.getUniformLocation(sceneProgram, 'uCollisionDebug');

    if (
      simulationPosition < 0 || scenePosition < 0 || !simulationState || !simulationMask || !simulationTexel || !simulationAspect || !simulationImageScale || !simulationImageOffset || !simulationDrop || !simulationHasDrop
      || !sceneBase || !sceneWave || !sceneMask || !sceneTexel || !sceneImageScale || !sceneImageOffset
      || !sceneFishPosition || !sceneFishLength || !sceneFishBend || !sceneFishPhase || !sceneCollisionRadiusRatio || !sceneDisplayAspect || !sceneCollisionDebug
    ) {
      gl.deleteProgram(simulationProgram);
      gl.deleteProgram(sceneProgram);
      gl.deleteBuffer(buffer);
      gl.deleteTexture(baseTexture);
      gl.deleteTexture(maskTexture);
      return undefined;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const configureQuad = (positionLocation: number) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    };

    const configureImageTexture = (texture: WebGLTexture) => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    configureImageTexture(baseTexture);
    configureImageTexture(maskTexture);
    // Do not interpolate the collision mask. Nearest-neighbour sampling keeps
    // the GPU boundary on the same source pixel used by the CPU collision test.
    gl.bindTexture(gl.TEXTURE_2D, maskTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    let waveRead: RenderTarget | null = null;
    let waveWrite: RenderTarget | null = null;
    // 192 cells across keeps circular waves smooth even on a 390px phone,
    // while remaining far below the full-resolution presentation pass.
    let simulationWidth = 192;
    let simulationHeight = 416;
    let raf = 0;
    let lastTime = performance.now();
    let simulationCarry = 1 / 60;
    let fishPulse = 0;
    let ambientPulse = .25;
    let imageReady = false;
    let sourceAspect = 853 / 1844;
    let imageScaleX = 1;
    let imageScaleY = 1;
    let imageOffsetX = 0;
    let imageOffsetY = 0;
    let imageOffsetRangeY = 0;
    let maskPixels: Uint8ClampedArray | null = null;
    let maskPixelWidth = 0;
    let maskPixelHeight = 0;
    let fishCurrentX = fishX;
    let fishTargetX = fishX;
    let fishVelocityX = 0;
    let fishBump = 0;
    let completed = false;
    let startedAt = performance.now();
    let pointerIsDown = false;
    let lastPointer: { x: number; y: number } | null = null;
    const pendingDrops: RippleDrop[] = [];
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const resetSimulation = () => {
      deleteRenderTarget(gl, waveRead);
      deleteRenderTarget(gl, waveWrite);
      waveRead = createRenderTarget(gl, simulationWidth, simulationHeight);
      waveWrite = createRenderTarget(gl, simulationWidth, simulationHeight);
      if (!waveRead || !waveWrite) return false;

      gl.clearColor(128 / 255, 128 / 255, .5, 1);
      for (const target of [waveRead, waveWrite]) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
        gl.viewport(0, 0, simulationWidth, simulationHeight);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return true;
    };

    const updateCoverTransform = (rect: DOMRect) => {
      const displayAspect = rect.width / Math.max(rect.height, 1);
      if (displayAspect > sourceAspect) {
        imageScaleX = 1;
        imageScaleY = sourceAspect / displayAspect;
        imageOffsetX = 0;
        imageOffsetRangeY = 1 - imageScaleY;
        imageOffsetY = playable ? imageOffsetRangeY : imageOffsetRangeY * .5;
      } else {
        imageScaleX = displayAspect / sourceAspect;
        imageScaleY = 1;
        imageOffsetX = (1 - imageScaleX) * .5;
        imageOffsetY = 0;
        imageOffsetRangeY = 0;
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      updateCoverTransform(rect);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width === width && canvas.height === height && waveRead && waveWrite) return true;

      canvas.width = width;
      canvas.height = height;
      simulationWidth = 192;
      simulationHeight = Math.max(226, Math.min(432, Math.round(simulationWidth * Math.max(rect.height / Math.max(rect.width, 1), 1.7))));
      return resetSimulation();
    };

    const enqueueDrop = (x: number, y: number, radiusPx: number, strength: number) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pendingDrops.push({
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
        radius: radiusPx / rect.height,
        strength,
      });
      if (pendingDrops.length > 12) pendingDrops.splice(0, pendingDrops.length - 12);
    };

    const pointerToNormalized = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      };
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerIsDown = true;
      lastPointer = pointerToNormalized(event);
      if (playable) fishTargetX = Math.max(.06, Math.min(.94, lastPointer.x));
      enqueueDrop(lastPointer.x, lastPointer.y, playable ? 19 : 26, playable ? .13 : .22);
      canvas.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      const point = pointerToNormalized(event);
      if (playable && (pointerIsDown || event.pointerType === 'mouse')) {
        fishTargetX = Math.max(.06, Math.min(.94, point.x));
      }
      if (!pointerIsDown) return;
      const rect = canvas.getBoundingClientRect();
      const distance = lastPointer ? Math.hypot((point.x - lastPointer.x) * rect.width, (point.y - lastPointer.y) * rect.height) : 0;
      enqueueDrop(
        point.x,
        point.y,
        playable ? Math.min(29, 15 + distance * .22) : Math.min(44, 21 + distance * .44),
        playable ? Math.min(.18, .075 + distance * .0012) : Math.min(.33, .13 + distance * .002),
      );
      lastPointer = point;
    };

    const onPointerEnd = (event: PointerEvent) => {
      pointerIsDown = false;
      lastPointer = null;
      if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!playable) return;
      if (event.key === 'ArrowLeft') fishTargetX = Math.max(.06, fishTargetX - .1);
      if (event.key === 'ArrowRight') fishTargetX = Math.min(.94, fishTargetX + .1);
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(raf);
      // The semantic <img> remains underneath as a reliable visual fallback.
      delete canvas.dataset.ready;
    };

    const advanceSimulation = (drop?: RippleDrop) => {
      if (!waveRead || !waveWrite) return;
      gl.bindFramebuffer(gl.FRAMEBUFFER, waveWrite.framebuffer);
      gl.viewport(0, 0, simulationWidth, simulationHeight);
      gl.useProgram(simulationProgram);
      configureQuad(simulationPosition);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, waveRead.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.uniform1i(simulationState, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, maskTexture);
      gl.uniform1i(simulationMask, 1);
      gl.uniform2f(simulationTexel, 1 / simulationWidth, 1 / simulationHeight);
      gl.uniform1f(simulationAspect, canvas.width / Math.max(canvas.height, 1));
      gl.uniform2f(simulationImageScale, imageScaleX, imageScaleY);
      gl.uniform2f(simulationImageOffset, imageOffsetX, imageOffsetY);
      gl.uniform1f(simulationHasDrop, drop ? 1 : 0);
      gl.uniform4f(simulationDrop, drop?.x ?? 0, drop?.y ?? 0, drop?.radius ?? 0, drop?.strength ?? 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      const previousRead = waveRead;
      waveRead = waveWrite;
      waveWrite = previousRead;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    const waterAtScreenPoint = (screenX: number, screenY: number) => {
      if (!maskPixels || !maskPixelWidth || !maskPixelHeight) return true;
      const sourceX = Math.round((screenX * imageScaleX + imageOffsetX) * (maskPixelWidth - 1));
      const sourceY = Math.round((screenY * imageScaleY + imageOffsetY) * (maskPixelHeight - 1));
      if (sourceX < 0 || sourceX >= maskPixelWidth || sourceY < 0 || sourceY >= maskPixelHeight) return false;
      return maskPixels[(sourceY * maskPixelWidth + sourceX) * 4] >= COLLISION_MASK_CUTOFF;
    };

    const fishHasClearance = (screenX: number, screenY: number, radiusPx: number) => {
      const rect = canvas.getBoundingClientRect();
      const radiusX = radiusPx / Math.max(rect.width, 1);
      const radiusY = radiusPx / Math.max(rect.height, 1);
      if (!waterAtScreenPoint(screenX, screenY)) return false;
      for (let index = 0; index < 12; index += 1) {
        const angle = index / 12 * Math.PI * 2;
        if (!waterAtScreenPoint(screenX + Math.cos(angle) * radiusX, screenY + Math.sin(angle) * radiusY)) return false;
      }
      return true;
    };

    const resolveFishCollision = (candidateX: number, screenY: number, radiusPx: number) => {
      if (fishHasClearance(candidateX, screenY, radiusPx)) return candidateX;
      const rect = canvas.getBoundingClientRect();
      const step = 4 / Math.max(rect.width, 1);
      for (let distance = step; distance <= .24; distance += step) {
        const leftCandidate = candidateX - distance;
        const rightCandidate = candidateX + distance;
        const preferLeft = fishVelocityX > 0 || (Math.abs(fishVelocityX) < .005 && fishTargetX >= candidateX);
        const candidates = preferLeft ? [leftCandidate, rightCandidate] : [rightCandidate, leftCandidate];
        for (const possible of candidates) {
          if (possible >= .05 && possible <= .95 && fishHasClearance(possible, screenY, radiusPx)) {
            fishVelocityX = Math.sign(possible - candidateX) * .075;
            fishTargetX = possible;
            fishBump = .22;
            enqueueDrop(possible, screenY, 15, .055);
            return possible;
          }
        }
      }
      fishVelocityX *= -.22;
      fishTargetX = fishCurrentX;
      fishBump = .22;
      return fishCurrentX;
    };

    const collisionRadiusPxFor = (rect: DOMRect) => Math.max(23, Math.min(28, rect.width * .064));

    const drawScene = (fishPositionX: number, fishPositionY: number, fishBend: number, fishPhase: number) => {
      if (!waveRead) return;
      const rect = canvas.getBoundingClientRect();
      const fishLengthPx = Math.max(50, Math.min(56, rect.width * .137));
      const collisionRadiusPx = collisionRadiusPxFor(rect);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(sceneProgram);
      configureQuad(scenePosition);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, baseTexture);
      gl.uniform1i(sceneBase, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, waveRead.texture);
      // The solver uses nearest texels, but visible refraction samples the
      // same height field linearly so waves stay liquid at mobile scale.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.uniform1i(sceneWave, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, maskTexture);
      gl.uniform1i(sceneMask, 2);
      gl.uniform2f(sceneTexel, 1 / simulationWidth, 1 / simulationHeight);
      gl.uniform2f(sceneImageScale, imageScaleX, imageScaleY);
      gl.uniform2f(sceneImageOffset, imageOffsetX, imageOffsetY);
      gl.uniform2f(sceneFishPosition, fishPositionX, fishPositionY);
      gl.uniform1f(sceneFishLength, fishLengthPx / Math.max(rect.height, 1));
      gl.uniform1f(sceneFishBend, fishBend);
      gl.uniform1f(sceneFishPhase, fishPhase);
      gl.uniform1f(sceneCollisionRadiusRatio, collisionRadiusPx / fishLengthPx);
      gl.uniform1f(sceneDisplayAspect, rect.width / Math.max(rect.height, 1));
      gl.uniform1f(sceneCollisionDebug, collisionDebug ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const render = (now: number) => {
      if (disposed) return;
      const delta = Math.min(.05, (now - lastTime) / 1000);
      lastTime = now;
      const seconds = now / 1000;
      const motionScale = reducedMotion ? .28 : 1;
      const forcedProgress = progressOverrideRef.current;
      const timelineProgress = forcedProgress === undefined
        ? Math.min(1, Math.max(0, (now - startedAt) / Math.max(durationMs, 1)))
        : Math.min(1, Math.max(0, forcedProgress));
      if (playable) imageOffsetY = (1 - timelineProgress) * imageOffsetRangeY;

      let currentFishX: number;
      let currentFishY: number;
      let horizontalVelocity: number;
      if (playable) {
        const desiredVelocity = (fishTargetX - fishCurrentX) * 4.8;
        fishVelocityX += (desiredVelocity - fishVelocityX) * Math.min(1, delta * 7.2);
        fishBump = Math.max(0, fishBump - delta);
        const candidateX = Math.max(.05, Math.min(.95, fishCurrentX + fishVelocityX * delta));
        const rect = canvas.getBoundingClientRect();
        const collisionRadius = collisionRadiusPxFor(rect);
        fishCurrentX = resolveFishCollision(candidateX, fishY, collisionRadius);
        currentFishX = fishCurrentX;
        currentFishY = fishY;
        horizontalVelocity = fishVelocityX;
      } else {
        currentFishX = fishX + (Math.sin(seconds * .55) * .014 + Math.sin(seconds * .19) * .006) * motionScale;
        currentFishY = fishY + Math.cos(seconds * .38) * .0045 * motionScale;
        horizontalVelocity = (Math.cos(seconds * .55) * .0077 + Math.cos(seconds * .19) * .00114) * motionScale;
      }
      const fishBend = Math.max(-.82, Math.min(.82, horizontalVelocity * (playable ? 1.6 : 64) + Math.sin(seconds * 1.18) * .18 * motionScale));
      const fishPhase = seconds * (reducedMotion ? .95 : 2.75);
      if (fishWake) {
        fishPulse -= delta;
        if (fishPulse <= 0) {
          const pullAmount = playable
            ? Math.min(1, Math.abs(fishTargetX - fishCurrentX) * 4.2 + Math.abs(horizontalVelocity) * 1.8)
            : .2;
          fishPulse = reducedMotion ? 1.25 : .48 - pullAmount * .27;
          const wakeLagX = Math.max(-.032, Math.min(.032, horizontalVelocity * .055));
          enqueueDrop(
            currentFishX - wakeLagX,
            Math.min(.98, currentFishY + .048),
            12 + pullAmount * 6,
            (reducedMotion ? .018 : .045) + pullAmount * (reducedMotion ? .018 : .085),
          );
          enqueueDrop(
            currentFishX - wakeLagX * 1.45 - fishBend * .006,
            Math.min(.98, currentFishY + .086),
            7 + pullAmount * 3,
            (reducedMotion ? .009 : .022) + pullAmount * (reducedMotion ? .01 : .04),
          );
        }
      }

      // Quiet background disturbances keep the GPU height field alive even
      // when the player is not touching the pond. Candidate points are tested
      // against the same scrolling water mask, so waves never begin on land.
      ambientPulse -= delta;
      if (!collisionDebug && ambientPulse <= 0) {
        ambientPulse = (reducedMotion ? 4.2 : 2.35) + Math.random() * (reducedMotion ? 2.5 : 1.85);
        for (let attempt = 0; attempt < 16; attempt += 1) {
          const rippleX = .08 + Math.random() * .84;
          const rippleY = .08 + Math.random() * .76;
          if (!fishHasClearance(rippleX, rippleY, 36)) continue;
          enqueueDrop(
            rippleX,
            rippleY,
            19 + Math.random() * 13,
            (reducedMotion ? .04 : .095) + Math.random() * (reducedMotion ? .025 : .05),
          );
          break;
        }
      }

      simulationCarry += delta;
      const stepDuration = reducedMotion ? 1 / 42 : 1 / 60;
      let steps = 0;
      while (simulationCarry >= stepDuration && steps < 3) {
        advanceSimulation(pendingDrops.shift());
        simulationCarry -= stepDuration;
        steps += 1;
      }
      if (!steps && pendingDrops.length) advanceSimulation(pendingDrops.shift());
      drawScene(currentFishX, currentFishY, fishBend, fishPhase);
      if (playable && forcedProgress === undefined && timelineProgress >= 1 && !completed) {
        completed = true;
        onCompleteRef.current?.();
        return;
      }
      raf = requestAnimationFrame(render);
    };

    const image = new Image();
    const mask = new Image();
    let baseLoaded = false;
    let maskLoaded = false;
    const begin = () => {
      if (disposed || !baseLoaded || !maskLoaded) return;
      if (!resize()) return;
      // vUv already follows DOM/image coordinates (0 at the visual top).
      // Uploading the artwork flipped made the GPU scene read the opposite
      // vertical row from the CPU collision sampler.
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, baseTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, maskTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = mask.naturalWidth;
      maskCanvas.height = mask.naturalHeight;
      const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
      if (maskContext) {
        maskContext.drawImage(mask, 0, 0);
        maskPixelWidth = maskCanvas.width;
        maskPixelHeight = maskCanvas.height;
        maskPixels = maskContext.getImageData(0, 0, maskPixelWidth, maskPixelHeight).data;
      }
      imageReady = true;
      startedAt = performance.now();
      canvas.dataset.ready = 'true';
      raf = requestAnimationFrame(render);
    };
    image.onload = () => {
      if (disposed) return;
      sourceAspect = image.naturalWidth / Math.max(image.naturalHeight, 1);
      baseLoaded = true;
      begin();
    };
    mask.onload = () => {
      if (disposed) return;
      maskLoaded = true;
      begin();
    };
    image.src = imageSrc;
    mask.src = maskSrc;

    const observer = new ResizeObserver(() => {
      if (!disposed && imageReady) resize();
    });
    observer.observe(canvas);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerEnd);
    canvas.addEventListener('pointercancel', onPointerEnd);
    canvas.addEventListener('pointerleave', onPointerEnd);
    canvas.addEventListener('webglcontextlost', onContextLost);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      image.onload = null;
      mask.onload = null;
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerEnd);
      canvas.removeEventListener('pointercancel', onPointerEnd);
      canvas.removeEventListener('pointerleave', onPointerEnd);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      window.removeEventListener('keydown', onKeyDown);
      deleteRenderTarget(gl, waveRead);
      deleteRenderTarget(gl, waveWrite);
      gl.deleteTexture(baseTexture);
      gl.deleteTexture(maskTexture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(simulationProgram);
      gl.deleteProgram(sceneProgram);
    };
  }, [collisionDebug, durationMs, fishWake, fishX, fishY, imageSrc, maskSrc, playable]);

  return <canvas ref={canvasRef} className={className} aria-label="可触碰产生波纹的春水池塘" />;
}
