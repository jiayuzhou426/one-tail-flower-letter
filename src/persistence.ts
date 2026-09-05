import type { SaveData } from './types';
const key='one-tail-flower-letter-save-v1';
export const defaults=():SaveData=>({version:1,hasSeenIntro:false,discoveredFlowerIds:[],pendingSeed:null,plantedFlowers:[],bouquet:[],totalTrips:0,soundEnabled:false});
export function loadSave():SaveData { try { const raw=localStorage.getItem(key); if(!raw) return defaults(); const v=JSON.parse(raw); return {...defaults(),...v, version:1, discoveredFlowerIds:Array.isArray(v.discoveredFlowerIds)?v.discoveredFlowerIds:[],plantedFlowers:Array.isArray(v.plantedFlowers)?v.plantedFlowers:[],bouquet:Array.isArray(v.bouquet)?v.bouquet:[]}; } catch { return defaults(); } }
export const save=(data:SaveData)=>localStorage.setItem(key,JSON.stringify(data));
export const clearSave=()=>localStorage.removeItem(key);
