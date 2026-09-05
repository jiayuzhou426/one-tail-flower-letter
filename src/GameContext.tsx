import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import type {SaveData,PendingSeed,PlantedFlower,BouquetStem} from './types'; import {loadSave,save,clearSave} from './persistence';
type Ctx={data:SaveData; patch:(p:Partial<SaveData>)=>void; receive:(id:string)=>void; plant:(p:PlantedFlower)=>void; setBouquet:(b:BouquetStem[])=>void; reset:()=>void};
const GameContext=createContext<Ctx|null>(null);
export function GameProvider({children}:{children:React.ReactNode}) { const [data,setData]=useState(loadSave); useEffect(()=>save(data),[data]); const value=useMemo<Ctx>(()=>({data,patch:p=>setData(d=>({...d,...p})),receive:id=>setData(d=>({...d,hasSeenIntro:true,totalTrips:d.totalTrips+1,pendingSeed:{flowerId:id,id:crypto.randomUUID()}})),plant:p=>setData(d=>({...d,plantedFlowers:[...d.plantedFlowers,p]})),setBouquet:b=>setData(d=>({...d,bouquet:b})),reset:()=>{clearSave();setData(loadSave())}}),[data]); return <GameContext.Provider value={value}>{children}</GameContext.Provider> }
export const useGame=()=>{const c=useContext(GameContext);if(!c)throw Error('GameProvider required');return c};
