export type Inventory = { wood: number; herb: number; ore: number; armor: number; armorEquipped: boolean; sword: number; potion: number; equipped: boolean; quest: string; questProgress: number; battleQuest: string; battleProgress: number; repeatQuest: string; repeatProgress: number; role: string; color: string; hair: string; face: string; gold: number; craftXp: number; storage: {wood:number; herb:number; ore:number; sword:number; potion:number; armor:number} };
export type Character = { id: number; name: string; x: number; z: number; level: number; xp: number; hp: number; mp: number; inventory: Inventory };
export const MAX_HP = 100;
export const MAX_MP = 50;
export const XP_PER_LEVEL = 30;
export const WORLD_LIMIT = 24;
export const OBSTACLE = { x: 4, z: 4, radius: 1.5 };
export const ASSETS = { player: 'primitive:player', monster: 'primitive:monster', tree: 'primitive:tree', sword: 'primitive:sword', skill: 'primitive:magic' } as const;

export const SHOP = { x: 1, z: 1, range: 3, buy: {potion:5}, sell: {wood:2,herb:2,ore:3,sword:5,potion:2,armor:7} } as const;

export const INVENTORY_CAPACITY = 100;
export function inventoryCount(items: Pick<Inventory,'wood'|'herb'|'ore'|'sword'|'potion'|'armor'>):number { return items.wood+items.herb+items.ore+items.sword+items.potion+items.armor; }
