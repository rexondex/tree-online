export type MonsterTarget={id:number;x:number;z:number;hp:number;busy:boolean};
import { MONSTER_ZONE, inMonsterZone } from '../../shared/game-data/index.js';
export type MonsterState={x:number;z:number;alive:boolean;lastAttack:number;mode:'idle'|'chase'|'windup'|'return';targetId:number|null;windupUntil:number};
const HOME=MONSTER_ZONE,DETECTION=7,LEASH=MONSTER_ZONE.radius,ATTACK_RANGE=1.7,SPEED=2.4,STEP=.05;
export function resetMonster(m:MonsterState){m.x=HOME.x;m.z=HOME.z;m.mode='idle';m.targetId=null;m.windupUntil=0;m.lastAttack=0;}
function move(m:MonsterState,x:number,z:number){const dx=x-m.x,dz=z-m.z,d=Math.hypot(dx,dz);if(d<.01)return;const step=Math.min(d,SPEED*STEP);const nx=m.x+dx/d*step,nz=m.z+dz/d*step;if(inMonsterZone(nx,nz)){m.x=nx;m.z=nz;}}
export function stepMonster<T extends MonsterTarget>(m:MonsterState,players:Iterable<T>,now:number):T|undefined{
 if(!m.alive)return;const eligible=[...players].filter(p=>!p.busy&&p.hp>0&&inMonsterZone(p.x,p.z));
 if(m.mode==='windup'){if(now<m.windupUntil)return;const target=eligible.find(p=>p.id===m.targetId);m.mode='chase';m.targetId=null;m.lastAttack=now;if(target&&Math.hypot(target.x-m.x,target.z-m.z)<=ATTACK_RANGE)return target;return;}
 const nearHome=Math.hypot(m.x-HOME.x,m.z-HOME.z);const target=nearHome<=LEASH?eligible.filter(p=>Math.hypot(p.x-HOME.x,p.z-HOME.z)<=LEASH&&Math.hypot(p.x-m.x,p.z-m.z)<=DETECTION).sort((a,b)=>Math.hypot(a.x-m.x,a.z-m.z)-Math.hypot(b.x-m.x,b.z-m.z))[0]:undefined;
 if(!target){m.targetId=null;if(nearHome>.15){m.mode='return';move(m,HOME.x,HOME.z);}else m.mode='idle';return;}
 m.targetId=target.id;const distance=Math.hypot(target.x-m.x,target.z-m.z);if(distance>ATTACK_RANGE){m.mode='chase';move(m,target.x,target.z);return;}if(now-m.lastAttack>=2000){m.mode='windup';m.windupUntil=now+700;}else m.mode='chase';
}
