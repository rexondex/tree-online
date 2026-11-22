import { HEROES, heroRole } from '../../shared/game-data/heroes';

export type CharacterEntry={id:number;name:string;level:number;role:string};

export function setupLoginScreens(onCreate:()=>void): {showCharacters:(characters:CharacterEntry[])=>void;showAccount:()=>void;add:(entry:CharacterEntry)=>void;selected:()=>number|null} {
  const panel=document.querySelector<HTMLElement>('#login > .panel')!;
  const account=document.createElement('section'),characters=document.createElement('section');
  account.className='account-screen';characters.className='character-screen';characters.hidden=true;
  const original=[...panel.childNodes];for(const node of original)account.appendChild(node);panel.append(account,characters);
  const byId=(id:string)=>document.querySelector<HTMLElement>('#'+id)!;
  const serverOptions=document.createElement('details');serverOptions.className='server-options';
  const serverTitle=document.createElement('summary');serverTitle.textContent='서버 설정';serverOptions.appendChild(serverTitle);
  const serverContent=document.createElement('div');serverContent.className='login-popover';
  for(const id of ['serverList','server']){const label=byId(id).closest('label');if(label)serverContent.appendChild(label);}
  for(const id of ['checkAllServers','saveServer','checkServer','serverStatus'])serverContent.appendChild(byId(id));
  serverOptions.appendChild(serverContent);account.appendChild(serverOptions);
  const appeal=account.querySelector<HTMLDetailsElement>('details:not(.server-options)');if(appeal){appeal.classList.add('appeal-options');const contents=document.createElement('div');contents.className='login-popover';for(const child of [...appeal.childNodes])if(!(child instanceof HTMLElement&&child.tagName==='SUMMARY'))contents.appendChild(child);appeal.appendChild(contents);}
  for(const id of ['character','heroRole','characterColor','characterHair','characterFace']){const label=byId(id).closest('label');if(label)characters.appendChild(label);}
  for(const id of ['heroDescription','heroStage','characterPreview','characterSelection'])characters.appendChild(byId(id));
  const heading=document.createElement('h1');heading.textContent='모험가 선택';characters.prepend(heading);
  byId('character').closest('label')?.classList.add('character-name');byId('heroRole').closest('label')?.classList.add('character-role');
  const create=document.createElement('button');create.type='button';create.className='create-character';create.textContent='새 캐릭터 생성';create.addEventListener('click',onCreate);
  characters.insertBefore(create,byId('characterSelection'));
  const message=byId('error');panel.appendChild(message);
  const list=document.querySelector<HTMLSelectElement>('#characterList')!;
  const selection=byId('characterSelection');selection.hidden=false;
  const entries=new Map<number,CharacterEntry>();
  const renderSelection=()=>{const entry=entries.get(Number(list.value));byId('characterInfo').textContent=entry?`${HEROES[heroRole(entry.role)].name} · ${HEROES[heroRole(entry.role)].className} · Lv.${entry.level}`:'새 캐릭터를 생성해 주세요.';const enter=document.querySelector<HTMLButtonElement>('#enterCharacter')!;enter.disabled=!entry;if(entry){const select=document.querySelector<HTMLSelectElement>('#heroRole')!;select.value=heroRole(entry.role);select.dispatchEvent(new Event('change'));}};
  list.addEventListener('change',renderSelection);
  const add=(entry:CharacterEntry)=>{entries.set(entry.id,entry);const option=document.createElement('option');option.value=String(entry.id);option.textContent=entry.name+' · Lv.'+entry.level;list.appendChild(option);list.value=String(entry.id);renderSelection();};
  return {showCharacters:(items)=>{entries.clear();list.replaceChildren();items.forEach(add);renderSelection();account.hidden=true;characters.hidden=false;message.textContent='';},showAccount:()=>{account.hidden=false;characters.hidden=true;message.textContent='';},add,selected:()=>entries.has(Number(list.value))?Number(list.value):null};
}
