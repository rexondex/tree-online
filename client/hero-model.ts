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
  const white=new THREE.MeshToonMaterial({color:0xf3eee2});
  const eyes=new THREE.MeshToonMaterial({color:role==='sword'?0x704328:role==='archer'?0x42834e:0x7755ad});
  part(new THREE.BoxGeometry(.38,.12,.37),accent,0,1.15,0);
  for(const x of [-.13,.13]){const iris=part(new THREE.SphereGeometry(.035,10,8),eyes,x,1.77,.35);iris.scale.set(.8,1.3,.4);}
  for(const side of [-1,1]){const lock=part(new THREE.CapsuleGeometry(.095,.42,4,8),hair,side*.29,1.58,-.06);lock.rotation.z=side*.12;}
  if(role==='sword'){
    part(new THREE.BoxGeometry(.4,.35,.13),white,0,1.3,.17);
    for(const side of [-1,1]){const shoulder=part(new THREE.SphereGeometry(.14,10,8),metal,side*.3,1.42,0);shoulder.scale.set(1,.65,1);}
    const bow=part(new THREE.OctahedronGeometry(.1),cloth,0,1.49,.22);bow.scale.set(1.7,.65,.5);
    for(const side of [-1,1]){const boot=part(new THREE.CapsuleGeometry(.105,.16,4,8),metal,side*.14,.18,.03);boot.scale.z=1.15;}
  }
  if(role==='archer'){
    const cape=part(new THREE.ConeGeometry(.42,.82,6),cloth,0,1.04,-.21);cape.rotation.x=-.12;
    part(new THREE.BoxGeometry(.35,.12,.12),accent,0,1.28,.2);
    const quiver=part(new THREE.CylinderGeometry(.07,.1,.45,8),dark,-.23,1.35,-.25);quiver.rotation.z=-.35;
  }
  if(role==='mage'){
    const brim=part(new THREE.CylinderGeometry(.45,.45,.06,16),cloth,0,2.08,0);
    brim.rotation.z=.09;const hat=part(new THREE.ConeGeometry(.3,.4,12),cloth,.02,2.28,0);hat.rotation.z=-.12;
    part(new THREE.OctahedronGeometry(.1),accent,0,2.13,.32);
    const mantle=part(new THREE.ConeGeometry(.45,.52,8),cloth,0,1.14,-.16);mantle.rotation.x=-.1;
  }
  const arms:THREE.Group[]=[];const legs:THREE.Group[]=[];
  for(const side of [-1,1]) { const arm=new THREE.Group();arm.position.set(side*.3,1.42,0);root.add(arm);part(new THREE.CapsuleGeometry(.075,.34,4,8),cloth,0,-.22,0,arm);part(new THREE.SphereGeometry(.08,8,6),skin,0,-.44,0,arm);arms.push(arm);const leg=new THREE.Group();leg.position.set(side*.14,.65,0);root.add(leg);part(new THREE.CapsuleGeometry(.09,.36,4,8),dark,0,-.24,0,leg);legs.push(leg); }
  const weapon=new THREE.Group();weapon.position.set(.07,-.4,.05);arms[1].add(weapon);
  if(role==='sword'){part(new THREE.BoxGeometry(.1,.75,.055),metal,0,.4,0,weapon);part(new THREE.BoxGeometry(.3,.06,.1),dark,0,.03,0,weapon);}
  if(role==='archer'){const curve=new THREE.EllipseCurve(0,0,.24,.48,-Math.PI/2,Math.PI/2,false,0);const points=curve.getPoints(24).map(p=>new THREE.Vector3(p.x,p.y,0));weapon.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xb79b6b})));weapon.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-.48,0),new THREE.Vector3(0,.48,0)]),new THREE.LineBasicMaterial({color:0xeeeecc})));}
  if(role==='mage'){part(new THREE.CylinderGeometry(.035,.045,1.2,8),dark,0,.4,0,weapon);part(new THREE.OctahedronGeometry(.13),new THREE.MeshStandardMaterial({color:0xbcc7ff,emissive:0x5555aa}),0,1.05,0,weapon);}
  const armor=part(new THREE.BoxGeometry(.58,.48,.34),metal,0,1.18,0);armor.name='armor';armor.visible=false;
  root.userData.parts={arms,legs};root.userData.role=role;return root;
}
