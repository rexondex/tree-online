import * as THREE from 'three';
import { heroRole } from '../shared/game-data/heroes';

// Placeholder geometry: replace individual parts with licensed character assets later.
export function createHero(value: unknown): THREE.Group {
  const role = heroRole(value);
  const root = new THREE.Group();
  const cloth = new THREE.MeshToonMaterial({color: role === 'sword' ? 0x4775b5 : role === 'archer' ? 0x407358 : 0x65518f});
  const hair = new THREE.MeshToonMaterial({color: role === 'sword' ? 0x754938 : role === 'archer' ? 0x294b38 : 0xc2c5d8});
  const skin = new THREE.MeshToonMaterial({color: 0xf0c6a8});
  const metal = new THREE.MeshStandardMaterial({color: 0xd4d9dc});
  const dark = new THREE.MeshStandardMaterial({color: 0x454051});
  const part = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = root) => { const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x,y,z); parent.add(mesh); return mesh; };
  part(new THREE.CylinderGeometry(.23,.34,.68,8),cloth,0,1.15,0);
  part(new THREE.ConeGeometry(role === 'mage' ? .45 : .32,.48,8),cloth,0,.73,0);
  part(new THREE.SphereGeometry(.36,16,12),skin,0,1.76,0);
  part(new THREE.SphereGeometry(.37,16,12,0,Math.PI*2,0,Math.PI*.48),hair,0,1.79,0);
  part(new THREE.BoxGeometry(.53,.56,.16),hair,0,1.51,-.27);
  for(const x of [-.13,.13]) {const eye=part(new THREE.SphereGeometry(.062,10,8),dark,x,1.77,.324);eye.scale.set(.7,1.3,.4);part(new THREE.SphereGeometry(.016,8,6),metal,x-.015,1.79,.351);}
  const fringe=part(new THREE.BoxGeometry(.64,.13,.15),hair,0,1.99,.27);fringe.rotation.z=.1;
  const accent=new THREE.MeshToonMaterial({color:role==='sword'?0xe5e5d6:role==='archer'?0xb39a69:0xe1bd67});
  part(new THREE.BoxGeometry(.38,.12,.37),accent,0,1.15,0);
  if(role==='mage') part(new THREE.OctahedronGeometry(.1),accent,0,2.09,.25);
  const arms:THREE.Group[]=[];const legs:THREE.Group[]=[];
  for(const side of [-1,1]) { const arm=new THREE.Group();arm.position.set(side*.3,1.42,0);root.add(arm);part(new THREE.CapsuleGeometry(.075,.34,4,8),cloth,0,-.22,0,arm);part(new THREE.SphereGeometry(.08,8,6),skin,0,-.44,0,arm);arms.push(arm);const leg=new THREE.Group();leg.position.set(side*.14,.65,0);root.add(leg);part(new THREE.CapsuleGeometry(.09,.36,4,8),dark,0,-.24,0,leg);legs.push(leg); }
  const weapon=new THREE.Group();weapon.position.set(.07,-.4,.05);arms[1].add(weapon);
  if(role==='sword'){part(new THREE.BoxGeometry(.1,.75,.055),metal,0,.4,0,weapon);part(new THREE.BoxGeometry(.3,.06,.1),dark,0,.03,0,weapon);}
  if(role==='archer'){const curve=new THREE.EllipseCurve(0,0,.24,.48,-Math.PI/2,Math.PI/2,false,0);const points=curve.getPoints(24).map(p=>new THREE.Vector3(p.x,p.y,0));weapon.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xb79b6b})));weapon.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-.48,0),new THREE.Vector3(0,.48,0)]),new THREE.LineBasicMaterial({color:0xeeeecc})));}
  if(role==='mage'){part(new THREE.CylinderGeometry(.035,.045,1.2,8),dark,0,.4,0,weapon);part(new THREE.OctahedronGeometry(.13),new THREE.MeshStandardMaterial({color:0xbcc7ff,emissive:0x5555aa}),0,1.05,0,weapon);}
  const armor=part(new THREE.BoxGeometry(.58,.48,.34),metal,0,1.18,0);armor.name='armor';armor.visible=false;
  root.userData.parts={arms,legs};return root;
}
