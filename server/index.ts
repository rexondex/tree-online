import 'dotenv/config';
import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { MAX_HP, MAX_MP, XP_PER_LEVEL, WORLD_LIMIT, OBSTACLE, type Character, type Inventory } from '../shared/game-data/index.js';

const port=Number(process.env.PORT||3000), host=process.env.HOST||'127.0.0.1';
if(!process.env.DATABASE_URL) mkdirSync('./.data',{recursive:true});
const db=process.env.DATABASE_URL?new pg.Pool({connectionString:process.env.DATABASE_URL}):new PGlite('./.data/postgres');
async function query(sql:string,params:unknown[]=[]):Promise<any[]> {return (db instanceof PGlite?await db.query(sql,params):await db.query(sql,params)).rows as any[];}
await query('CREATE TABLE IF NOT EXISTS accounts (id SERIAL PRIMARY KEY, username VARCHAR(24) UNIQUE NOT NULL, password_hash TEXT NOT NULL, x REAL NOT NULL DEFAULT 0, z REAL NOT NULL DEFAULT 0)');
await query(`CREATE TABLE IF NOT EXISTS characters (id SERIAL PRIMARY KEY, account_id INTEGER NOT NULL UNIQUE REFERENCES accounts(id), name VARCHAR(24) NOT NULL UNIQUE, x REAL NOT NULL DEFAULT 0, z REAL NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 1, xp INTEGER NOT NULL DEFAULT 0, hp INTEGER NOT NULL DEFAULT 100, mp INTEGER NOT NULL DEFAULT 50, inventory TEXT NOT NULL DEFAULT '{"wood":0,"sword":0,"equipped":false}')`);
const sessions=new Map<string,number>();
type Player=Character & {accountId:number; socket:WebSocket; dx:number; dz:number; lastInput:number; cooldown:number; saveQueue:Promise<void>};
const players=new Map<number,Player>();
const lastChat = new Map<number,number>();
const lastEscape = new Map<number,number>();
const monster={id:1,x:3,z:-4,hp:50,maxHp:50,alive:true,respawn:0,lastAttack:0};
const resource={id:1,x:-4,z:-4,available:true,respawn:0};
const json=(res:import('node:http').ServerResponse,status:number,data:unknown)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const send=(p:Player,data:unknown)=>{if(p.socket.readyState===WebSocket.OPEN)p.socket.send(JSON.stringify(data));};
const notice=(p:Player,message:string)=>send(p,{type:'notice',message});
function save(p:Player):Promise<void>{const values=[p.x,p.z,p.level,p.xp,p.hp,p.mp,JSON.stringify(p.inventory),p.id];p.saveQueue=p.saveQueue.then(async()=>{await query('UPDATE characters SET x=$1,z=$2,level=$3,xp=$4,hp=$5,mp=$6,inventory=$7 WHERE id=$8',values);}).catch(e=>{console.error('저장 실패:',e);notice(p,'저장에 실패했습니다. 서버 상태를 확인하세요.');});return p.saveQueue;}
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url||'/', 'http://localhost');
 if(req.method==='OPTIONS')return json(res,204,{});
 if(req.method==='GET'&&url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end('<!doctype html><meta charset="utf-8"><title>온라인 RPG</title><h1>온라인 RPG 개발 서버</h1><p>서버가 실행 중입니다. Electron 클라이언트로 접속하세요.</p><p>설치 파일은 아직 제공되지 않습니다.</p><a href="/api/health">서버 상태</a>');}
 if(req.method==='GET'&&url.pathname==='/api/health')return json(res,200,{ok:true,players:players.size});
 if(req.method==='GET'&&url.pathname==='/api/admin/stats'){if(!process.env.ADMIN_TOKEN||req.headers.authorization!==`Bearer ${process.env.ADMIN_TOKEN}`)return json(res,403,{error:'접근이 거부되었습니다.'});return json(res,200,{players:[...players.values()].map(({id,name,x,z})=>({id,name,x,z})),uptime:process.uptime()});}
 if(req.method!=='POST'||!['/api/register','/api/login'].includes(url.pathname))return json(res,404,{error:'Not found'});
 let body='';for await(const chunk of req){body+=chunk;if(body.length>4096)return json(res,413,{error:'요청이 너무 큽니다.'});}let data:any;try{data=JSON.parse(body);}catch{return json(res,400,{error:'잘못된 요청입니다.'});}
 const username=typeof data.username==='string'?data.username.trim():'';const password=typeof data.password==='string'?data.password:'';
 if(!/^[a-zA-Z0-9_]{3,24}$/.test(username)||password.length<8||password.length>128)return json(res,400,{error:'아이디는 영문/숫자/밑줄 3~24자, 비밀번호는 8~128자여야 합니다.'});
 if(url.pathname==='/api/register'){const salt=randomBytes(16).toString('hex');const hash=scryptSync(password,salt,64).toString('hex');try{await query('INSERT INTO accounts (username,password_hash) VALUES ($1,$2)',[username,`${salt}:${hash}`]);return json(res,201,{ok:true});}catch(e:any){if(e.code==='23505')return json(res,409,{error:'이미 존재하는 아이디입니다.'});throw e;}}
 const [account]=await query('SELECT * FROM accounts WHERE username=$1',[username]);if(!account)return json(res,401,{error:'아이디 또는 비밀번호가 올바르지 않습니다.'});const [salt,stored]=account.password_hash.split(':');const hash=scryptSync(password,salt,64),expected=Buffer.from(stored,'hex');if(hash.length!==expected.length||!timingSafeEqual(hash,expected))return json(res,401,{error:'아이디 또는 비밀번호가 올바르지 않습니다.'});
 const token=randomBytes(32).toString('hex');sessions.set(token,account.id);setTimeout(()=>sessions.delete(token),3600000).unref();const [character]=await query('SELECT id,name FROM characters WHERE account_id=$1',[account.id]);return json(res,200,{token,character:character||null});
}catch(e){console.error(e);return json(res,500,{error:'서버 오류가 발생했습니다.'});}});
const wss=new WebSocketServer({server,maxPayload:2048});
wss.on('error',(e:NodeJS.ErrnoException)=>{console.error(e.code==='EADDRINUSE'?`포트 ${port}이 이미 사용 중입니다.`:e.message);process.exitCode=1;});
wss.on('connection',socket=>{let p:Player|undefined;let joining=false;const timeout=setTimeout(()=>{if(!p)socket.close(1008,'Authentication required');},10000);
 socket.on('message',async raw=>{try{const msg=JSON.parse(raw.toString());
  if(!p){if(joining)return;if(msg.type!=='join'||typeof msg.token!=='string')return socket.close(1008,'Unauthorized');joining=true;const accountId=sessions.get(msg.token);sessions.delete(msg.token);if(!accountId||[...players.values()].some(v=>v.accountId===accountId))return socket.close(1008,'중복 접속 또는 만료된 세션');let [row]=await query('SELECT * FROM characters WHERE account_id=$1',[accountId]);if(!row){const name=typeof msg.name==='string'?msg.name.trim():'';if(!/^[가-힣a-zA-Z0-9_]{2,16}$/.test(name)){socket.send(JSON.stringify({type:'joinError',message:'캐릭터 이름은 한글, 영문, 숫자, 밑줄 2~16자로 입력하세요.'}));return socket.close();}try{[row]=await query('INSERT INTO characters (account_id,name) VALUES ($1,$2) RETURNING *',[accountId,name]);}catch(e:any){socket.send(JSON.stringify({type:'joinError',message:e.code==='23505'?'이미 사용 중인 캐릭터 이름입니다.':'캐릭터 생성에 실패했습니다.'}));return socket.close();}}
  if(socket.readyState!==WebSocket.OPEN||[...players.values()].some(v=>v.accountId===accountId))return socket.close();const inventory:Inventory=JSON.parse(row.inventory);p={id:row.id,accountId,name:row.name,x:row.x,z:row.z,level:row.level,xp:row.xp,hp:row.hp,mp:row.mp,inventory,dx:0,dz:0,lastInput:Date.now(),cooldown:0,socket,saveQueue:Promise.resolve()};players.set(p.id,p);clearTimeout(timeout);send(p,{type:'welcome',id:p.id});for(const other of players.values())if(other.id!==p.id)notice(other,p.name+' 님이 입장했습니다.');return;}
  if(msg.type==='move'&&Number.isFinite(msg.dx)&&Number.isFinite(msg.dz)){const len=Math.hypot(msg.dx,msg.dz);if(!Number.isFinite(len))return;p.dx=len>1?msg.dx/len:msg.dx;p.dz=len>1?msg.dz/len:msg.dz;p.lastInput=Date.now();}
  if(msg.type==='chat'){
   if(typeof msg.text!=='string')return notice(p,'올바른 메시지를 입력하세요.');
   const text=msg.text.replace(/[\u0000-\u001f\u007f]/g,' ').trim();
   if(!text||text.length>120)return notice(p,'채팅은 1~120자로 입력하세요.');
   const now=Date.now();if(now-(lastChat.get(p.id)||0)<1000)return notice(p,'채팅은 1초에 한 번 보낼 수 있습니다.');
   lastChat.set(p.id,now);const message={type:'chat',name:p.name,text};for(const other of players.values())send(other,message);
  }
  if(msg.type==='escape'){const now=Date.now();if(now-(lastEscape.get(p.id)||0)<60000)return notice(p,'탈출은 60초에 한 번 사용할 수 있습니다.');lastEscape.set(p.id,now);p.x=0;p.z=0;p.dx=0;p.dz=0;notice(p,'시작 지점으로 이동했습니다.');void save(p);}
  if(msg.type==='emote'){const now=Date.now();if(now-(lastChat.get(p.id)||0)<1000)return notice(p,'잠시 후 다시 감정 표현을 사용하세요.');lastChat.set(p.id,now);for(const other of players.values())send(other,{type:'emote',id:p.id,name:p.name,emote:'wave'});}
  if(msg.type==='attack'||msg.type==='skill'){const now=Date.now();if(now<p.cooldown)return notice(p,'아직 사용할 수 없습니다.');if(msg.type==='skill'&&p.mp<10)return notice(p,'마나가 부족합니다.');if(!monster.alive||Math.hypot(p.x-monster.x,p.z-monster.z)>4)return notice(p,'공격할 몬스터가 근처에 없습니다.');p.cooldown=now+(msg.type==='skill'?2500:800);if(msg.type==='skill'){p.mp-=10;for(const other of players.values())send(other,{type:'skillEffect',x:p.x,z:p.z,targetX:monster.x,targetZ:monster.z});}const damage=msg.type==='skill'?25:(p.inventory.equipped?20:10);monster.hp-=damage;if(monster.hp<=0){monster.hp=0;monster.alive=false;monster.respawn=now+8000;p.xp+=20;while(p.xp>=p.level*XP_PER_LEVEL){p.xp-=p.level*XP_PER_LEVEL;p.level++;notice(p,`레벨 ${p.level} 달성!`);}notice(p,'몬스터 처치: 피해 '+damage+', 경험치 20 · 현재 레벨 '+p.level);}else notice(p,'공격 명중: 피해 '+damage);void save(p);}
  if(msg.type==='gather'){if(!resource.available||Math.hypot(p.x-resource.x,p.z-resource.z)>3)return notice(p,'채집할 나무가 근처에 없거나 재생 중입니다.');resource.available=false;resource.respawn=Date.now()+10000;p.inventory.wood++;notice(p,'나무 +1');void save(p);}
  if(msg.type==='craft'){if(msg.recipe!=='wood_sword')return notice(p,'제작법을 선택하세요.');if(p.inventory.wood<2)return notice(p,'제작에는 나무 2개가 필요합니다.');p.inventory.wood-=2;p.inventory.sword++;notice(p,'나무 검 제작 완료');void save(p);}
  if(msg.type==='equip'){if(p.inventory.sword<1)return notice(p,'착용할 나무 검이 없습니다.');p.inventory.equipped=!p.inventory.equipped;notice(p,p.inventory.equipped?'나무 검 착용':'나무 검 해제');void save(p);}
 }catch(e){console.error(e);socket.close(1003,'Invalid message');}});
 socket.on('close',()=>{clearTimeout(timeout);if(p&&players.get(p.id)===p){players.delete(p.id);for(const other of players.values())notice(other,p.name+' 님이 퇴장했습니다.');lastChat.delete(p.id);lastEscape.delete(p.id);void save(p);}});
});
setInterval(()=>{const now=Date.now();if(!monster.alive&&now>=monster.respawn){monster.alive=true;monster.hp=monster.maxHp;}if(!resource.available&&now>=resource.respawn)resource.available=true;
 for(const p of players.values()){if(now-p.lastInput>500)p.dx=p.dz=0;const x=Math.max(-WORLD_LIMIT,Math.min(WORLD_LIMIT,p.x+p.dx*.2)),z=Math.max(-WORLD_LIMIT,Math.min(WORLD_LIMIT,p.z+p.dz*.2));if(Math.hypot(x-OBSTACLE.x,z-OBSTACLE.z)>OBSTACLE.radius){p.x=x;p.z=z;}}
 if(monster.alive&&now-monster.lastAttack>2000){const target=[...players.values()].find(p=>Math.hypot(p.x-monster.x,p.z-monster.z)<2);if(target){monster.lastAttack=now;target.hp-=15;if(target.hp<=0){target.hp=MAX_HP;target.mp=MAX_MP;target.x=0;target.z=0;notice(target,'쓰러져서 시작 지점에서 부활했습니다.');}else notice(target,'몬스터에게 피해 15를 입었습니다.');void save(target);}}
},50);
setInterval(()=>{for(const p of players.values()){if(p.mp<MAX_MP){p.mp=Math.min(MAX_MP,p.mp+1);send(p,{type:'recovery',resource:'mp',amount:1});}} },3000);
setInterval(()=>{const state=JSON.stringify({type:'state',players:[...players.values()].map(({id,name,x,z,level,xp,hp,mp,inventory,cooldown})=>({id,name,x,z,level,xp,hp,mp,inventory,cooldownRemaining:Math.max(0,cooldown-Date.now())})),monster,resource:{...resource,remaining:Math.max(0,resource.respawn-Date.now())}});for(const p of players.values())if(p.socket.readyState===WebSocket.OPEN)p.socket.send(state);},100);
setInterval(()=>{for(const p of players.values())void save(p);},15000);
server.listen(port,host,()=>console.log(`Server: http://${host}:${port} (${process.env.DATABASE_URL?'PostgreSQL':'local PGlite'})`));
