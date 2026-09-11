import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import type {SaveData,FlowerPatch,BouquetStem} from './types'; import {loadSave,save,clearSave} from './persistence';
type Ctx={data:SaveData; patch:(p:Partial<SaveData>)=>void; receive:(id:string)=>void; plantPatch:(p:FlowerPatch)=>void; setBouquet:(b:BouquetStem[])=>void; reset:()=>void};
const GameContext=createContext<Ctx|null>(null);
export function GameProvider({children}:{children:React.ReactNode}) { const [data,setData]=useState(loadSave); useEffect(()=>save(data),[data]); const value=useMemo<Ctx>(()=>({data,patch:p=>setData(d=>({...d,...p})),receive:id=>setData(d=>({...d,hasSeenIntro:true,totalTrips:d.totalTrips+1,pendingSeed:{flowerId:id,id:crypto.randomUUID()}})),plantPatch:p=>setData(d=>({...d,flowerPatches:[...d.flowerPatches,p]})),setBouquet:b=>setData(d=>({...d,bouquet:b})),reset:()=>{clearSave();setData(loadSave())}}),[data]); return <GameContext.Provider value={value}>{children}</GameContext.Provider> }
export const useGame=()=>{const c=useContext(GameContext);if(!c)throw Error('GameProvider required');return c};
