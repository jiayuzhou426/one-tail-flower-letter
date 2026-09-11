import {exploreAssets} from './assetManifest';
const load=(src:string)=>new Promise<HTMLImageElement>((ok,bad)=>{const image=new Image();image.onload=()=>image.decode().then(()=>ok(image)).catch(()=>ok(image));image.onerror=bad;image.src=src});
export async function loadExploreAssets(){const [water,...rest]=await Promise.all([load(exploreAssets.water),...exploreAssets.fish.map(load),...exploreAssets.clusters.map(load)]);return{water,fish:rest.slice(0,7),clusters:rest.slice(7)}}
