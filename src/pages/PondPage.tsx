import {useState} from 'react';
import {useGame} from '../GameContext'; import {flowerById,flowers} from '../data/flowers';
import {Flower} from '../components/Flower'; import {Ripple} from '../components/Ripple';
export function PondPage({openArrange}:{openArrange:()=>void}){
 const {data,plant,patch}=useGame(); const [drawer,setDrawer]=useState(false); const [newFlower,setNewFlower]=useState<string|null>(null); const seed=data.pendingSeed;
 const drop=(e:React.PointerEvent)=>{if(!seed)return;const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(x<.08||x>.92||y<.1||y>.9)return;plant({id:crypto.randomUUID(),flowerId:seed.flowerId,x,y,plantedAt:Date.now()});if(!data.discoveredFlowerIds.includes(seed.flowerId)){patch({discoveredFlowerIds:[...data.discoveredFlowerIds,seed.flowerId]});setNewFlower(seed.flowerId)}else patch({pendingSeed:null})};
 const close=()=>{patch({pendingSeed:null});setNewFlower(null)};
 return <main className="pond page"><header className="pond-head"><div><p className="eyebrow">花塘</p><p>已记住 {data.discoveredFlowerIds.length}/5 次花开</p></div><button className="icon-button" onClick={()=>setDrawer(true)}>▦<span>图鉴</span></button></header>
 <div className="pond-water" onPointerUp={drop}>{data.plantedFlowers.map(p=><div className="planted" key={p.id} style={{left:`${p.x*100}%`,top:`${p.y*100}%`}}><Ripple/><Flower id={p.flowerId} size={54}/></div>)}{seed&&<div className="seed" aria-label="花种"><span>✦</span><Flower id={seed.flowerId} size={42}/></div>}<span className="pond-shine s1"/><span className="pond-shine s2"/></div>
 <p className="pond-hint">{seed?'拖入水中':'再去远一点的水域。'}</p>
 {drawer&&<div className="modal-back" onClick={()=>setDrawer(false)}><aside className="catalog" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setDrawer(false)}>×</button><h2>水路图鉴</h2>{flowers.map(f=>{const yes=data.discoveredFlowerIds.includes(f.id);return <article className={'catalog-row '+(!yes?'locked':'')} key={f.id}>{yes?<Flower id={f.id} size={48}/>:<span className="outline">✿</span>}<div><b>{yes?f.name:'尚未抵达'}</b><small>{yes?`${f.meaning} · ${f.rarity}`:'水面仍留着空白'}</small></div></article>})}</aside></div>}
 {newFlower&&<div className="modal-back"><section className="discover-card"><Flower id={newFlower} size={100}/><p className="eyebrow">新的花信</p><h2>{flowerById(newFlower).name}</h2><p>{flowerById(newFlower).meaning}</p><blockquote>{flowerById(newFlower).discovery}</blockquote><button className="primary" onClick={close}>记住这次花开</button></section></div>}
 <button className="arrange-link" onClick={openArrange}>去插花 →</button></main>
}
