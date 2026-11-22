import { SHOP, type Progress } from './index.js';

export const NPCS = [
  {id:'merchant',name:'상인 로아',x:SHOP.x,z:SHOP.z,range:SHOP.range,color:0xa5684d,dialogue:'어서 오세요! 모험에 필요한 물품을 살펴보세요.'},
  {id:'guide',name:'마을 안내인 별이',x:-3,z:2,range:3,color:0x698ac2,dialogue:'초원에 오신 것을 환영해요. 나무와 약초를 모으고, 안전 구역 밖에서 몬스터와 싸워 보세요.'},
  {id:'trainer',name:'수련가 다온',x:-3,z:-3,range:3,color:0x976eac,dialogue:'레벨이 오르면 성장 창에서 능력과 기술을 강화할 수 있어요.'}
] as const;
export function progressOf(value:unknown):Progress {
  const p=(value&&typeof value==='object'?value:{}) as Partial<Progress>;
  const safe=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>=0?Number(n):0;
  return {attack:safe(p.attack),defense:safe(p.defense),skill:safe(p.skill)};
}
