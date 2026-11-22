import { randomUUID } from 'node:crypto';
type Outcome='active'|'success'|'failed';
type Run={id:string;allowed:Set<number>;joined:Set<number>;hits:number;endsAt:number;outcome:Outcome;finishedAt:number;lastHit:Map<number,number>};
type PartyView={leader:number;members:Array<{id:number;online:boolean}|null>}|null;
export class TrialDungeon {
 private runs=new Map<string,Run>();private assigned=new Map<number,string>();
 constructor(private send:(id:number,data:unknown)=>void,private record:(runId:string,participants:number[],outcome:'success'|'failed')=>Promise<void>=async()=>{}){}
 private notice(id:number,message:string){this.send(id,{type:'notice',message});}
 private finish(run:Run,outcome:'success'|'failed'){if(run.outcome!=='active')return;run.outcome=outcome;run.finishedAt=Date.now();const participants=[...run.joined];for(const id of participants)this.notice(id,outcome==='success'?'시련 성공! 시험 콘텐츠에는 보상이 없습니다.':'시련 시간이 끝나 실패했습니다.');void this.record(run.id,participants,outcome).catch(error=>{console.error('시련 기록 저장 실패',error);for(const id of participants)this.notice(id,'시련 결과를 기록하지 못했습니다.');});}
 private update(run:Run){if(run.outcome==='active'&&Date.now()>=run.endsAt)this.finish(run,'failed');}
 start(id:number,party:PartyView){if(this.assigned.has(id))return this.notice(id,'이미 진행 중인 시련이 있습니다.');if(party&&party.leader!==id)return this.notice(id,'파티 리더만 시련을 시작할 수 있습니다.');const candidates=party?party.members.filter((p):p is {id:number;online:boolean}=>!!p&&p.online).map(p=>p.id):[id];if(candidates.some(member=>this.assigned.has(member)))return this.notice(id,'파티원 중 이미 시련에 참여 중인 사람이 있습니다.');const run:Run={id:randomUUID(),allowed:new Set(candidates),joined:new Set([id]),hits:0,endsAt:Date.now()+60000,outcome:'active',finishedAt:0,lastHit:new Map()};this.runs.set(run.id,run);for(const member of candidates){this.assigned.set(member,run.id);if(member!==id)this.notice(member,'파티 시련이 열렸습니다. 던전 패널에서 입장하세요.');}this.notice(id,'시련이 시작되었습니다.');}
 join(id:number){const run=this.get(id);if(!run)return this.notice(id,'입장 가능한 시련이 없습니다.');this.update(run);if(run.outcome!=='active')return this.notice(id,'시련이 이미 종료되었습니다.');run.joined.add(id);this.notice(id,'시련에 입장했습니다.');}
 attack(id:number){const run=this.get(id);if(!run||!run.joined.has(id))return this.notice(id,'시련에 먼저 입장하세요.');this.update(run);if(run.outcome!=='active')return this.notice(id,'시련이 이미 종료되었습니다.');const now=Date.now();if(now-(run.lastHit.get(id)||0)<800)return this.notice(id,'잠시 후 다시 공격하세요.');run.lastHit.set(id,now);run.hits++;if(run.hits>=5)this.finish(run,'success');}
 leave(id:number){const run=this.get(id);if(!run)return this.notice(id,'참여 중인 시련이 없습니다.');run.allowed.delete(id);run.joined.delete(id);this.assigned.delete(id);this.send(id,{type:'dungeonState',dungeon:null});if(!run.allowed.size)this.runs.delete(run.id);this.notice(id,'시련에서 나왔습니다.');}
 get(id:number){const runId=this.assigned.get(id);return runId?this.runs.get(runId):undefined;}
 snapshot(id:number){const run=this.get(id);if(!run)return null;this.update(run);return {joined:run.joined.has(id),outcome:run.outcome,hits:run.hits,required:5,remaining:Math.max(0,Math.ceil((run.endsAt-Date.now())/1000)),participants:run.joined.size};}
 cleanup(){for(const run of this.runs.values()){this.update(run);if(run.outcome!=='active'&&Date.now()-run.finishedAt>300000){for(const id of run.allowed)this.assigned.delete(id);this.runs.delete(run.id);}}}
}
