import { useMemo, useRef, useState } from 'react';
import { exploreAssets } from '../game/explore/assetManifest';
import { templates, type Placement } from '../game/explore/mapTemplates';

const WORLD_WIDTH = 700;
const WORLD_HEIGHT = 2048;
const DRAFT_KEY = 'one-tail-flower-letter:map-editor';
const clone = (items: Placement[]) => items.map((item) => ({ ...item, colliders: item.colliders.map((shape) => ({ ...shape })) }));
const renderScale = (_cluster: number) => 1;

type Drag = { index: number; dx: number; dy: number };

export function MapEditor() {
  const [templateIndex, setTemplateIndex] = useState(0);
  const [placements, setPlacements] = useState<Placement[]>(() => clone(templates[0].placements));
  const [selected, setSelected] = useState(0);
  const drag = useRef<Drag | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const active = placements[selected];

  const output = useMemo(() => {
    const lines = placements.map((item) => {
      const fn = item.flip ? 'right' : 'left';
      return `  ${fn}(${item.cluster}, ${Math.round(item.y)}, ${Math.round(item.w)}, ${Math.round(item.x)})`;
    });
    return `{ id: 'hand-composed', placements: [\n${lines.join(',\n')},\n] },`;
  }, [placements]);

  const chooseTemplate = (index: number) => {
    setTemplateIndex(index);
    setPlacements(clone(templates[index].placements));
    setSelected(0);
  };
  const change = (patch: Partial<Placement>) => setPlacements((current) => current.map((item, index) => index === selected ? { ...item, ...patch } : item));
  const point = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = board.current!.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * WORLD_WIDTH / rect.width, y: (event.clientY - rect.top) * WORLD_HEIGHT / rect.height };
  };
  const startDrag = (event: React.PointerEvent<HTMLImageElement>, index: number) => {
    event.stopPropagation();
    const cursor = point(event as unknown as React.PointerEvent<HTMLDivElement>);
    const item = placements[index];
    drag.current = { index, dx: cursor.x - item.x, dy: cursor.y - item.y };
    setSelected(index);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const cursor = point(event);
    const { index, dx, dy } = drag.current;
    setPlacements((current) => current.map((item, itemIndex) => itemIndex === index ? {
      ...item,
      x: Math.round(Math.max(-900, Math.min(WORLD_WIDTH + 200, cursor.x - dx))),
      y: Math.round(Math.max(-120, Math.min(WORLD_HEIGHT - 60, cursor.y - dy))),
    } : item));
  };
  const add = (flip: boolean) => {
    setPlacements((current) => [...current, { cluster: 0, x: flip ? 470 : -150, y: 1000, w: 380, flip, colliders: [] }]);
    setSelected(placements.length);
  };
  const saveDraft = () => localStorage.setItem(DRAFT_KEY, JSON.stringify(placements));
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const next = JSON.parse(saved) as Placement[];
      if (Array.isArray(next) && next.length) { setPlacements(next); setSelected(0); }
    } catch { /* keep the current hand-composed layout */ }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(output); } catch { /* output remains selectable */ } };
  const download = (name: string, content: string, mime: string) => {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const link = document.createElement('a');
    link.href = url; link.download = name; link.click();
    URL.revokeObjectURL(url);
  };
  const exportJson = () => download('one-tail-flower-letter-map.json', JSON.stringify({ id: 'hand-composed', placements: placements.map(({ cluster, x, y, w, flip }) => ({ cluster, x: Math.round(x), y: Math.round(y), w: Math.round(w), flip: Boolean(flip) })) }, null, 2), 'application/json');
  const exportTypeScript = () => download('one-tail-flower-letter-map.ts', `// Paste this entry into templates in mapTemplates.ts\n${output}\n`, 'text/typescript');

  return <main style={{ minHeight: '100dvh', background: '#e8f3f1', color: '#294c4d', fontFamily: 'system-ui, sans-serif', padding: '14px 12px 34px' }}>
    <header style={{ maxWidth: 1040, margin: '0 auto 14px' }}>
      <p style={{ margin: 0, fontSize: 12, letterSpacing: '.08em', color: '#5a7f7c' }}>DEVELOPMENT MAP EDITOR</p>
      <h1 style={{ fontFamily: 'STSong, SimSun, serif', fontWeight: 400, margin: '4px 0 8px', fontSize: 27 }}>远游地图摆放台</h1>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>拖动组团调整世界坐标；绿色虚线为近似碰撞区。所有 PNG 均按原始比例预览，宽度滑块是唯一的显示尺寸控制。</p>
    </header>
    <section style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 700px) minmax(250px, 320px)', gap: 16, alignItems: 'start' }}>
      <div ref={board} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerLeave={() => { drag.current = null; }} style={{ position: 'relative', width: '100%', aspectRatio: `${WORLD_WIDTH}/${WORLD_HEIGHT}`, overflow: 'hidden', touchAction: 'none', background: `url(${exploreAssets.water}) center / 100% 100%`, boxShadow: '0 10px 30px rgba(39,100,111,.16)' }}>
        {placements.map((item, index) => {
          const factor = renderScale(item.cluster);
          const selectedItem = index === selected;
          return <div key={`${item.cluster}-${index}`} style={{ position: 'absolute', left: `${item.x / WORLD_WIDTH * 100}%`, top: `${item.y / WORLD_HEIGHT * 100}%`, width: `${item.w * factor / WORLD_WIDTH * 100}%`, outline: selectedItem ? '2px solid rgba(255,255,255,.95)' : '1px solid rgba(255,255,255,.22)', outlineOffset: -1 }}>
            <img src={exploreAssets.clusters[item.cluster]} draggable={false} onPointerDown={(event) => startDrag(event, index)} alt={`组团 ${item.cluster}`} style={{ width: '100%', height: 'auto', display: 'block', transform: item.flip ? 'scaleX(-1)' : undefined, cursor: 'grab', userSelect: 'none' }} />
            {selectedItem && <i style={{ position: 'absolute', left: '16%', top: '16%', width: '62%', height: '58%', border: '1px dashed rgba(255,255,255,.9)', borderRadius: '50%', pointerEvents: 'none' }} />}
          </div>;
        })}
      </div>
      <aside style={{ background: 'rgba(255,255,255,.74)', padding: 14, border: '1px solid rgba(82,121,111,.18)' }}>
        <label style={{ fontSize: 12, display: 'block', marginBottom: 5 }}>地图模板</label>
        <select value={templateIndex} onChange={(event) => chooseTemplate(Number(event.target.value))} style={{ width: '100%', padding: 8, border: '1px solid #b7d1c8', background: 'white' }}>
          {templates.map((item, index) => <option key={item.id} value={index}>{item.id}</option>)}
        </select>
        {active && <div style={{ marginTop: 17, display: 'grid', gap: 10 }}>
          <label>组团编号<input min={0} max={12} type="number" value={active.cluster} onChange={(event) => change({ cluster: Number(event.target.value) })} /></label>
          <label>世界 X<input type="number" value={Math.round(active.x)} onChange={(event) => change({ x: Number(event.target.value) })} /></label>
          <label>世界 Y<input type="number" value={Math.round(active.y)} onChange={(event) => change({ y: Number(event.target.value) })} /></label>
          <label>基础宽度<input min={80} max={520} type="range" value={active.w} onChange={(event) => change({ w: Number(event.target.value) })} /><small>{Math.round(active.w)}</small></label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={Boolean(active.flip)} onChange={(event) => change({ flip: event.target.checked })} />右岸镜像</label>
          <button onClick={() => setPlacements((current) => current.filter((_, index) => index !== selected))}>移除当前组团</button>
        </div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}><button onClick={() => add(false)}>+ 左岸</button><button onClick={() => add(true)}>+ 右岸</button></div>
        <div style={{ display: 'flex', gap: 8, marginTop: 9, flexWrap: 'wrap' }}><button onClick={saveDraft}>保存浏览器草稿</button><button onClick={loadDraft}>载入草稿</button><button onClick={copy}>复制配置</button><button onClick={exportJson}>导出 JSON</button><button onClick={exportTypeScript}>导出 TS</button></div>
        <textarea readOnly value={output} style={{ marginTop: 14, width: '100%', minHeight: 180, resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: 11, lineHeight: 1.45, border: '1px solid #b7d1c8', padding: 8 }} />
      </aside>
    </section>
    <style>{`label{font-size:12px;color:#466665}input[type=number]{display:block;width:100%;box-sizing:border-box;margin-top:4px;padding:6px;border:1px solid #b7d1c8;background:white;color:#294c4d}input[type=range]{width:86%;vertical-align:middle}small{padding-left:8px}button{border:1px solid #8eafa6;background:#f7fbfa;color:#315b59;padding:7px 9px;font-size:12px;cursor:pointer}@media(max-width:760px){section{grid-template-columns:1fr!important}aside{max-width:none}}`}</style>
  </main>;
}
