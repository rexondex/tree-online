export type HeroRole='sword'|'archer'|'mage';
export const HEROES:Record<HeroRole,{name:string;className:string;range:number;damage:number;skillDamage:number;description:string}>={
 sword:{name:'아린',className:'검사',range:4,damage:10,skillDamage:25,description:'가까운 적을 검으로 상대하는 전사'},
 archer:{name:'세린',className:'궁수',range:7,damage:8,skillDamage:20,description:'멀리서 활을 쏘는 사수'},
 mage:{name:'루나',className:'마법사',range:6,damage:7,skillDamage:30,description:'마나로 강한 마법을 사용하는 마법사'}
};
export function heroRole(value:unknown):HeroRole{return value==='archer'||value==='mage'?value:'sword';}
