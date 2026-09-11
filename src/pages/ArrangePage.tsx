import {useRef,useState} from 'react';
import {useGame} from '../GameContext';
import {Flower} from '../components/Flower';
import {Vase} from '../components/Vase';
import {bouquetLines} from '../data/copywriting';
import type {BouquetStem} from '../types';

const positions=[[34,75],[67,73],[48,57],[25,54],[76,50]];
export function ArrangePage(){
 const {data,setBouquet}=useGame(); const [done,setDone]=useState(false); const [drag,setDrag]=useState<string|null>(null);
 const [line]=useState(()=>bouquetLines[Math.floor(Math.random()*bouquetLines.length)]); const press=useRef(0);
 const add=(flowerId:string)=>{if(data.bouquet.length<5)setBouquet([...data.bouquet,{id:crypto.randomUUID(),flowerId,slot:data.bouquet.length,heightOffset:0,angle:0}])};
 const update=(stem:BouquetStem)=>setBouquet(data.bouquet.map(x=>x.id===stem.id?stem:x));
 return <main className="arrange page"><header className="arrange-head"><div><p className="eyebrow">花瓶</p><p>把远方安放下来</p></div><button className="quiet" onClick={()=>setBouquet([])}>清空</button></header>
 <div className="vase-stage" onPointerUp={()=>setDrag(null)}>{data.bouquet.map(stem=>{const [x,y]=positions[stem.slot];return <button key={stem.id} className="stem" style={{left:`${x}%`,top:`${y-stem.heightOffset/3}%`,transform:`translate(-50%,-100%) rotate(${stem.angle}deg)`,zIndex:10-stem.slot}} onClick={()=>update({...stem,angle:stem.angle===-18?0:stem.angle===0?18:-18})} onDoubleClick={()=>setBouquet(data.bouquet.filter(x=>x.id!==stem.id))} onPointerDown={e=>{press.current=e.clientY;setDrag(stem.id);e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(drag===stem.id&&e.buttons){const heightOffset=Math.max(-32,Math.min(44,(press.current-e.clientY)/3));update({...stem,heightOffset})}}}><Flower id={stem.flowerId} size={74} stem/></button>})}<Vase/></div>
 <p className="arrange-tip">点击转向 · 上下拖动调整高度 · 双击移除</p><div className="flower-shelf">{data.discoveredFlowerIds.length?data.discoveredFlowerIds.map(id=><button key={id} onClick={()=>add(id)}><Flower id={id} size={48}/><span>{id==='water_lily'?'睡莲':id==='nameless'?'未名花':id==='narcissus'?'水仙':id==='iris'?'鸢尾':'白莲'}</span></button>):<p>花还在远处的水里。</p>}</div>
 <button className="primary leave" disabled={!data.bouquet.length} onClick={()=>setDone(true)}>留下这一瓶</button>{done&&<div className="modal-back"><section className="finish-card"><span>✦</span><h2>一瓶水路</h2><p>{line}</p><button className="primary" onClick={()=>setDone(false)}>再看一会儿</button></section></div>}</main>
}
