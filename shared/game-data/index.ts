export type Inventory = { wood: number; sword: number; potion: number; equipped: boolean; quest: string; questProgress: number };
export type Character = { id: number; name: string; x: number; z: number; level: number; xp: number; hp: number; mp: number; inventory: Inventory };
export const MAX_HP = 100;
export const MAX_MP = 50;
export const XP_PER_LEVEL = 30;
export const WORLD_LIMIT = 24;
export const OBSTACLE = { x: 4, z: 4, radius: 1.5 };
export const ASSETS = { player: 'primitive:player', monster: 'primitive:monster', tree: 'primitive:tree', sword: 'primitive:sword', skill: 'primitive:magic' } as const;
