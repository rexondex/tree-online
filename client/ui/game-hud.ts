import { heroRole } from '../../shared/game-data/heroes';

export function installGameHud(): void {
  const game=document.querySelector<HTMLElement>('#game')!;
  const hud=document.querySelector<HTMLElement>('.hud')!;
  const bars=document.createElement('div');bars.className='status-bars';
  bars.innerHTML='<div class="status-track hp"><span id="hudHpBar"></span><b id="hudHpText"></b></div><div class="status-track mp"><span id="hudMpBar"></span><b id="hudMpText"></b></div>';
  hud.insertBefore(bars,document.querySelector('#logout'));
  const portrait=document.createElement('img');portrait.id='hudPortrait';portrait.className='hud-portrait';portrait.alt='';hud.prepend(portrait);
  const menu=document.createElement('nav');menu.className='game-menu';menu.setAttribute('aria-label','게임 메뉴');
  for(const [label,selector,icon] of [['가방·의뢰','.info','▣'],['파티','.party','♟'],['친구','.friends','♥'],['시련','.dungeon','⚔'],['설정','.settings','⚙'],['도움말','.help','?']] as const){
    const panel=document.querySelector<HTMLElement>(selector)!;panel.hidden=true;
    const button=document.createElement('button');button.type='button';button.dataset.panel=selector.slice(1);button.title=label;button.setAttribute('aria-label',label);button.setAttribute('aria-expanded','false');const symbol=document.createElement('span');symbol.className='menu-icon';symbol.textContent=icon;const text=document.createElement('span');text.className='menu-label';text.textContent=label;button.append(symbol,text);
    button.addEventListener('click',()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));});menu.appendChild(button);
  }
  game.appendChild(menu);
  const map=document.querySelector<HTMLElement>('.worldmap')!;const mapTools=document.createElement('details');mapTools.className='map-tools';const summary=document.createElement('summary');summary.textContent='모험 메뉴';mapTools.appendChild(summary);for(const id of ['escape','wave','selectedPlayer'])mapTools.appendChild(document.querySelector<HTMLElement>('#'+id)!);map.appendChild(mapTools);
  const notice=document.querySelector<HTMLElement>('#notice')!;notice.classList.add('game-notice');game.appendChild(notice);
  const info=document.querySelector<HTMLElement>('#infoPanel')!;info.hidden=false;
  const chatPanel=document.querySelector<HTMLElement>('#chatPanel')!;chatPanel.hidden=true;
  const chatToggle=document.querySelector<HTMLButtonElement>('#chatToggle')!;chatToggle.textContent='채팅 열기';chatToggle.setAttribute('aria-expanded','false');
}

export function updateGameHud(hp:number,mp:number,maxHp:number,maxMp:number,role:unknown):void {
  const hpBar=document.querySelector<HTMLElement>('#hudHpBar')!,mpBar=document.querySelector<HTMLElement>('#hudMpBar')!;
  hpBar.style.width=`${Math.max(0,Math.min(100,hp/maxHp*100))}%`;mpBar.style.width=`${Math.max(0,Math.min(100,mp/maxMp*100))}%`;
  document.querySelector('#hudHpText')!.textContent=`HP ${hp} / ${maxHp}`;document.querySelector('#hudMpText')!.textContent=`MP ${mp} / ${maxMp}`;
  const portrait=document.querySelector<HTMLImageElement>('#hudPortrait')!,src=`${import.meta.env.BASE_URL}assets/characters/illustrations/${heroRole(role)}-sd.png`;if(portrait.getAttribute('src')!==src)portrait.src=src;
}
