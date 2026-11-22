import { HEROES, heroRole } from '../shared/game-data/heroes';

const assets = `${import.meta.env.BASE_URL}assets/`;
const icons: Record<string, [number, number]> = {
  '나무': [0, 0], '약초': [1, 0], '광물': [2, 0],
  '나무 검': [0, 1], '광물 갑옷': [1, 1], '회복 물약': [2, 1]
};

export function installHeroPreview(select: HTMLSelectElement): void {
  const stage = document.querySelector<HTMLElement>('#heroStage')!;
  const portrait = document.querySelector<HTMLImageElement>('#heroPortrait')!;
  stage.style.backgroundImage = `linear-gradient(0deg, rgba(24,51,45,.4), transparent 60%), url("${assets}backgrounds/selection-v2.png")`;
  const update = () => {
    const role = heroRole(select.value);
    portrait.src = `${assets}characters/illustrations/${role}-sd.png`;
    portrait.alt = `${HEROES[role].name} ${HEROES[role].className} 전신 일러스트`;
  };
  select.addEventListener('change', update);
  update();
}

let previous = '';
export function renderInventory(items: Array<{name:string;count:number}>): void {
  const key = JSON.stringify(items);
  if (key === previous) return;
  previous = key;
  const container = document.querySelector<HTMLElement>('#inventoryItems')!;
  container.replaceChildren();
  container.classList.add('inventory-grid');
  for (const item of items) {
    const cell = document.createElement('div');cell.className='inventory-cell';
    const image = document.createElement('span');image.className='item-icon';
    const [column,row] = icons[item.name] ?? [0,0];
    image.style.backgroundImage = `url("${assets}items/inventory-atlas.png")`;
    image.style.backgroundPosition = `${column*50}% ${row*100}%`;
    const caption = document.createElement('span');caption.textContent = `${item.name} ${item.count}`;
    cell.append(image, caption);container.append(cell);
  }
}
