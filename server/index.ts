import 'dotenv/config';
import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';

const port = Number(process.env.PORT || 3000);
if (!process.env.DATABASE_URL) mkdirSync('./.data', { recursive: true });
const db = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL }) : new PGlite('./.data/postgres');
async function query(sql: string, params: unknown[] = []): Promise<any[]> { const result = db instanceof PGlite ? await db.query(sql, params) : await db.query(sql, params); return result.rows as any[]; }
await query(`CREATE TABLE IF NOT EXISTS accounts (id SERIAL PRIMARY KEY, username VARCHAR(24) UNIQUE NOT NULL, password_hash TEXT NOT NULL, x REAL NOT NULL DEFAULT 0, z REAL NOT NULL DEFAULT 0)`);
const sessions = new Map<string, number>();
type Player = { id: number; name: string; x: number; z: number; dx: number; dz: number; socket: WebSocket; lastInput: number; };
const players = new Map<number, Player>();
const admin = process.env.ADMIN_TOKEN || '';
const json = (res: import('node:http').ServerResponse, status: number, data: unknown) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Cache-Control':'no-store'}); res.end(JSON.stringify(data)); };
const page = `<!doctype html><html lang="ko"><meta charset="utf-8"><title>온라인 RPG 서버</title><style>body{font:16px system-ui;max-width:720px;margin:5rem auto;background:#101b26;color:#e5edf1;line-height:1.7}code{background:#233647;padding:.2rem}.card{background:#1a2d3b;padding:1.5rem;border-radius:12px}</style><h1>온라인 RPG 개발 서버</h1><div class="card"><p>서버가 실행 중입니다. 게임은 Electron 클라이언트에서 로그인하세요.</p><p>설치 파일은 아직 준비되지 않았습니다. 개발 환경에서는 README의 실행 방법을 사용하세요.</p><p><a href="/api/health" style="color:#8ad9cc">서버 상태 확인</a></p><h2>개발자 도구</h2><p>서버 환경 변수 ADMIN_TOKEN을 설정하고 <code>GET /api/admin/stats</code>에 Bearer 토큰을 전달하면 접속 인원과 플레이어 상태를 확인할 수 있습니다.</p></div></html>`;
const server = createServer(async (req,res) => {
 try {
  const url = new URL(req.url || '/', 'http://localhost');
  if(req.method === 'OPTIONS') return json(res, 204, {});
  if(req.method === 'GET' && url.pathname === '/') {res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}); return res.end(page);}
  if(req.method === 'GET' && url.pathname === '/api/health') return json(res,200,{ok:true, players:players.size});
  if(req.method === 'GET' && url.pathname === '/api/admin/stats') { if (!admin || req.headers.authorization !== `Bearer ${admin}`) return json(res,403,{error:'접근이 거부되었습니다.'}); return json(res,200,{players:[...players.values()].map(({id,name,x,z})=>({id,name,x,z})), uptime:process.uptime()}); }
  if(req.method !== 'POST' || !['/api/register','/api/login'].includes(url.pathname)) return json(res,404,{error:'Not found'});
  let body=''; for await (const chunk of req) { body += chunk; if(body.length > 4096) return json(res,413,{error:'요청이 너무 큽니다.'}); }
  let data: any; try { data=JSON.parse(body); } catch { return json(res,400,{error:'잘못된 요청입니다.'}); }
  const username=typeof data.username==='string'?data.username.trim():''; const password=typeof data.password==='string'?data.password:'';
  if(!/^[a-zA-Z0-9_]{3,24}$/.test(username) || password.length<8 || password.length>128) return json(res,400,{error:'아이디는 영문/숫자/밑줄 3~24자, 비밀번호는 8~128자여야 합니다.'});
  if(url.pathname==='/api/register') { const salt=randomBytes(16).toString('hex'); const hash=scryptSync(password,salt,64).toString('hex'); try { await query('INSERT INTO accounts (username,password_hash) VALUES ($1,$2)',[username,`${salt}:${hash}`]); return json(res,201,{ok:true}); } catch(e:any) { if(e.code==='23505') return json(res,409,{error:'이미 존재하는 아이디입니다.'}); throw e; } }
  const [account]=await query('SELECT * FROM accounts WHERE username=$1',[username]);
  if(!account) return json(res,401,{error:'아이디 또는 비밀번호가 올바르지 않습니다.'});
  const [salt,stored]=account.password_hash.split(':'); const hash=scryptSync(password,salt,64); const expected=Buffer.from(stored,'hex');
  if(hash.length!==expected.length || !timingSafeEqual(hash,expected)) return json(res,401,{error:'아이디 또는 비밀번호가 올바르지 않습니다.'});
  const token=randomBytes(32).toString('hex'); sessions.set(token,account.id); setTimeout(()=>sessions.delete(token), 60*60*1000).unref(); return json(res,200,{token,name:account.username});
 } catch(e) { console.error(e); return json(res,500,{error:'서버 오류가 발생했습니다.'}); }
});
const wss = new WebSocketServer({server, maxPayload:2048});
wss.on('error', (error: NodeJS.ErrnoException) => {
 if (error.code === 'EADDRINUSE') console.error(`포트 ${port}이 이미 사용 중입니다. 실행 중인 서버를 사용하거나 종료한 뒤 다시 실행하세요.`);
 else console.error('서버 오류:', error.message);
 process.exitCode = 1;
});
wss.on('connection',(socket) => {
 let player: Player | undefined;
 const timeout=setTimeout(()=>{if(!player) socket.close(1008,'Authentication required');},5000);
 socket.on('message',async raw=>{ try {
  const msg=JSON.parse(raw.toString());
  if(!player) { if(msg.type!=='join' || typeof msg.token!=='string') return socket.close(1008,'Unauthorized'); const id=sessions.get(msg.token); sessions.delete(msg.token); if(!id || players.has(id)) return socket.close(1008,'Invalid session or already online'); const [account]=await query('SELECT id,username,x,z FROM accounts WHERE id=$1',[id]); if(!account || players.has(id) || socket.readyState!==WebSocket.OPEN) return socket.close(); player={id,name:account.username,x:account.x,z:account.z,dx:0,dz:0,socket,lastInput:Date.now()}; players.set(id,player); socket.send(JSON.stringify({type:'welcome',id})); return; }
  if(msg.type==='move' && Number.isFinite(msg.dx) && Number.isFinite(msg.dz)) { const len=Math.hypot(msg.dx,msg.dz); player.dx=len>1?msg.dx/len:msg.dx; player.dz=len>1?msg.dz/len:msg.dz; player.lastInput=Date.now(); }
 } catch { socket.close(1003,'Invalid message'); } });
 socket.on('close',()=>{clearTimeout(timeout); if(player && players.get(player.id)===player) {players.delete(player.id); void query('UPDATE accounts SET x=$1,z=$2 WHERE id=$3',[player.x,player.z,player.id]).catch(console.error);} });
});
setInterval(()=>{ for(const p of players.values()) { if(Date.now()-p.lastInput>500) p.dx=p.dz=0; p.x=Math.max(-24,Math.min(24,p.x+p.dx*4/20)); p.z=Math.max(-24,Math.min(24,p.z+p.dz*4/20)); } },50);
setInterval(()=>{const state=JSON.stringify({type:'state',players:[...players.values()].map(({id,name,x,z})=>({id,name,x,z}))}); for(const p of players.values()) if(p.socket.readyState===WebSocket.OPEN) p.socket.send(state);},100);
server.listen(port,process.env.HOST || '127.0.0.1',()=>console.log(`Server: http://127.0.0.1:${port} (${process.env.DATABASE_URL?'PostgreSQL':'local PGlite'})`));



