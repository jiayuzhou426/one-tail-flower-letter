import type { FlowerDefinition } from '../types';
export const flowers: FlowerDefinition[] = [
 {id:'lotus',name:'白莲',biome:'荷叶浅湾',meaning:'澄明',rarity:'普通',discovery:'有些答案，一直浮在水面。',colors:['#F7F5ED','#F2CE63']},
 {id:'iris',name:'鸢尾',biome:'芦苇雨岸',meaning:'回音',rarity:'普通',discovery:'风没有回答，只留下了一粒种子。',colors:['#7B8FC7','#F2CE63']},
 {id:'water_lily',name:'睡莲',biome:'雾中静水',meaning:'停留',rarity:'普通',discovery:'它在最安静的地方等你。',colors:['#E7B6C5','#F2CE63']},
 {id:'narcissus',name:'水仙',biome:'淡金滩涂',meaning:'归来',rarity:'较少',discovery:'绕过很远的水，仍会回到这里。',colors:['#FFF8D0','#F2CE63']},
 {id:'nameless',name:'未名花',biome:'雨后隐湾',meaning:'未说出口的话',rarity:'稀有',discovery:'你还不知道它的名字。',colors:['#B48DBA','#F2CE63']}
];
export const flowerById=(id:string)=>flowers.find(f=>f.id===id)!;
