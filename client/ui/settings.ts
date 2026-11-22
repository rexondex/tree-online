export type Action = 'attack'|'skill'|'gather'|'craft'|'equip'|'emote';
export type Settings = { bindings: Record<Action,string>; fontSize:'normal'|'large'; contrast:boolean };
const defaults:Settings={bindings:{attack:'1',skill:'2',gather:'e',craft:'c',equip:'f',emote:'r'},fontSize:'normal',contrast:false};
export const actionNames:Record<Action,string>={attack:'공격',skill:'마법',gather:'채집',craft:'제작',equip:'검 착용',emote:'손 흔들기'};
export function loadSettings():Settings {try {const value=JSON.parse(localStorage.getItem('rpg-settings')||'null');if(!value||!value.bindings)return structuredClone(defaults);const keys=Object.keys(defaults.bindings) as Action[];const bindings={} as Record<Action,string>;for(const action of keys){const key=value.bindings[action];if(typeof key!=='string'||!/^[a-z0-9]$/.test(key))return structuredClone(defaults);bindings[action]=key;}if(new Set(Object.values(bindings)).size!==keys.length||Object.values(bindings).some(key=>'wasd'.includes(key)))return structuredClone(defaults);return {bindings,fontSize:value.fontSize==='large'?'large':'normal',contrast:value.contrast===true};}catch{return structuredClone(defaults);}}
export function saveSettings(value:Settings){localStorage.setItem('rpg-settings',JSON.stringify(value));}
export function resetSettings():Settings{return structuredClone(defaults);}
