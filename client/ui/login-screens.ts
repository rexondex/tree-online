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
  const roster=document.createElement('div');roster.className='hero-roster';roster.setAttribute('aria-label','보유 캐릭터');characters.appendChild(roster);
  const pagination=document.createElement('div');pagination.className='roster-pagination';
  const previous=document.createElement('button'),next=document.createElement('button'),pageText=document.createElement('span');previous.type=next.type='button';previous.textContent='‹';next.textContent='›';previous.setAttribute('aria-label','이전 캐릭터 목록');next.setAttribute('aria-label','다음 캐릭터 목록');pagination.append(previous,pageText,next);characters.appendChild(pagination);
  const newButton=document.createElement('button');newButton.type='button';newButton.className='new-character-toggle';newButton.textContent='+ 캐릭터 생성';characters.appendChild(newButton);
  const createPanel=document.createElement('div');createPanel.className='character-create-panel';createPanel.hidden=true;
  const createHeading=document.createElement('strong');createHeading.textContent='새로운 모험가';createPanel.appendChild(createHeading);
  for(const id of ['character','heroRole']){const label=byId(id).closest('label');if(label)createPanel.appendChild(label);}
  createPanel.append(byId('heroDescription'),create);characters.appendChild(createPanel);
  newButton.addEventListener('click',()=>{createPanel.hidden=!createPanel.hidden;newButton.setAttribute('aria-expanded',String(!createPanel.hidden));});
  const message=byId('error');panel.appendChild(message);
  const list=document.querySelector<HTMLSelectElement>('#characterList')!;
  const selection=byId('characterSelection');selection.hidden=false;
  const entries=new Map<number,CharacterEntry>();
  let page=0;
  function renderRoster(){const all=[...entries.values()],pages=Math.max(1,Math.ceil(all.length/6));page=Math.max(0,Math.min(page,pages-1));roster.replaceChildren();for(const entry of all.slice(page*6,page*6+6)){const role=heroRole(entry.role),button=document.createElement('button');button.type='button';button.className='hero-card';button.setAttribute('aria-pressed',String(String(entry.id)===list.value));const img=document.createElement('img');img.src=`${import.meta.env.BASE_URL}assets/characters/illustrations/${role}-sd.png`;img.alt='';const name=document.createElement('strong');name.textContent=entry.name;const subtitle=document.createElement('span');subtitle.textContent=`Lv.${entry.level} · ${HEROES[role].className}`;button.append(img,name,subtitle);button.addEventListener('click',()=>{list.value=String(entry.id);renderSelection();});roster.appendChild(button);}if(!all.length){const empty=document.createElement('p');empty.className='roster-empty';empty.textContent='아직 모험가가 없습니다. 새 캐릭터를 만들어 보세요.';roster.appendChild(empty);}pageText.textContent=`${page+1} / ${pages}`;previous.disabled=page===0;next.disabled=page>=pages-1;}
  previous.addEventListener('click',()=>{page--;renderRoster();});next.addEventListener('click',()=>{page++;renderRoster();});
  const renderSelection=()=>{const entry=entries.get(Number(list.value));byId('characterInfo').textContent=entry?`${entry.name} · ${HEROES[heroRole(entry.role)].name} ${HEROES[heroRole(entry.role)].className} · Lv.${entry.level}`:'새 캐릭터를 생성해 주세요.';const enter=document.querySelector<HTMLButtonElement>('#enterCharacter')!;enter.disabled=!entry;if(entry){const select=document.querySelector<HTMLSelectElement>('#heroRole')!;select.value=heroRole(entry.role);select.dispatchEvent(new Event('change'));}renderRoster();};
  list.addEventListener('change',renderSelection);
  const add=(entry:CharacterEntry)=>{entries.set(entry.id,entry);const option=document.createElement('option');option.value=String(entry.id);option.textContent=entry.name+' · Lv.'+entry.level;list.appendChild(option);list.value=String(entry.id);page=Math.floor((entries.size-1)/6);createPanel.hidden=true;newButton.setAttribute('aria-expanded','false');renderSelection();};
  return {showCharacters:(items)=>{entries.clear();list.replaceChildren();page=0;items.forEach(add);page=0;if(items.length)list.value=String(items[0].id);createPanel.hidden=items.length>0;newButton.setAttribute('aria-expanded',String(!createPanel.hidden));renderSelection();account.hidden=true;characters.hidden=false;message.textContent='';},showAccount:()=>{account.hidden=false;characters.hidden=true;message.textContent='';},add,selected:()=>entries.has(Number(list.value))?Number(list.value):null};
}
