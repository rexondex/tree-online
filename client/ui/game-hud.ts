export function installGameHud(): void {
  const game=document.querySelector<HTMLElement>('#game')!;
  const hud=document.querySelector<HTMLElement>('.hud')!;
  const bars=document.createElement('div');bars.className='status-bars';
  bars.innerHTML='<div class="status-track hp"><span id="hudHpBar"></span><b id="hudHpText"></b></div><div class="status-track mp"><span id="hudMpBar"></span><b id="hudMpText"></b></div>';
  hud.insertBefore(bars,document.querySelector('#logout'));
  const menu=document.createElement('nav');menu.className='game-menu';menu.setAttribute('aria-label','게임 메뉴');
  for(const [label,selector] of [['가방·의뢰','.info'],['파티','.party'],['친구','.friends'],['시련','.dungeon'],['설정','.settings'],['도움말','.help']] as const){
    const panel=document.querySelector<HTMLElement>(selector)!;panel.hidden=true;
    const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-expanded','false');
    button.addEventListener('click',()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));});menu.appendChild(button);
  }
  game.appendChild(menu);
  const notice=document.querySelector<HTMLElement>('#notice')!;notice.classList.add('game-notice');game.appendChild(notice);
  const info=document.querySelector<HTMLElement>('#infoPanel')!;info.hidden=false;
  const chatPanel=document.querySelector<HTMLElement>('#chatPanel')!;chatPanel.hidden=true;
  const chatToggle=document.querySelector<HTMLButtonElement>('#chatToggle')!;chatToggle.textContent='채팅 열기';chatToggle.setAttribute('aria-expanded','false');
}

export function updateGameHud(hp:number,mp:number,maxHp:number,maxMp:number):void {
  const hpBar=document.querySelector<HTMLElement>('#hudHpBar')!,mpBar=document.querySelector<HTMLElement>('#hudMpBar')!;
  hpBar.style.width=`${Math.max(0,Math.min(100,hp/maxHp*100))}%`;mpBar.style.width=`${Math.max(0,Math.min(100,mp/maxMp*100))}%`;
  document.querySelector('#hudHpText')!.textContent=`HP ${hp} / ${maxHp}`;document.querySelector('#hudMpText')!.textContent=`MP ${mp} / ${maxMp}`;
}
