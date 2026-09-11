import type {FlowerPatch, PlantedFlower, SaveData} from './types';
const key='one-tail-flower-letter-save-v1';
export const defaults=():SaveData=>({version:2,hasSeenIntro:false,discoveredFlowerIds:[],pendingSeed:null,flowerPatches:[],bouquet:[],totalTrips:0,soundEnabled:false});
const legacyPatch=(p:PlantedFlower):FlowerPatch=>({id:p.id,flowerId:p.flowerId,plantedAt:p.plantedAt,points:Array.from({length:9},(_,i)=>({x:Math.min(.92,Math.max(.08,p.x+((i%3)-1)*.018)),y:Math.min(.9,Math.max(.1,p.y+(Math.floor(i/3)-1)*.018)),scale:.72+(i%4)*.08,rotation:(i-4)*7,delay:i*55}))});
export function loadSave():SaveData { try { const raw=localStorage.getItem(key); if(!raw) return defaults(); const v=JSON.parse(raw); const patches=Array.isArray(v.flowerPatches)?v.flowerPatches:Array.isArray(v.plantedFlowers)?v.plantedFlowers.map(legacyPatch):[]; return {...defaults(),...v,version:2,flowerPatches:patches,discoveredFlowerIds:Array.isArray(v.discoveredFlowerIds)?v.discoveredFlowerIds:[],bouquet:Array.isArray(v.bouquet)?v.bouquet:[]}; } catch { return defaults(); } }
export const save=(data:SaveData)=>localStorage.setItem(key,JSON.stringify(data));
export const clearSave=()=>localStorage.removeItem(key);
