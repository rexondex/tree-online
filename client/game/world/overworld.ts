import * as THREE from 'three';
import { NPCS } from '../../../shared/game-data/village';
import { WORLD_LIMIT } from '../../../shared/game-data';

export function buildOverworld(scene:THREE.Scene,label:(text:string)=>THREE.Sprite):THREE.Group[] {
  const npcs:THREE.Group[]=[];
  for(const npc of NPCS){const group=new THREE.Group();group.userData.npcId=npc.id;const body=new THREE.Mesh(new THREE.CapsuleGeometry(.32,.6,4,8),new THREE.MeshToonMaterial({color:npc.color}));body.position.y=.85;const head=new THREE.Mesh(new THREE.SphereGeometry(.25,12,8),new THREE.MeshToonMaterial({color:0xf1c9aa}));head.position.y=1.62;const hat=new THREE.Mesh(new THREE.ConeGeometry(.33,.32,8),new THREE.MeshToonMaterial({color:npc.color}));hat.position.y=1.92;group.add(body,head,hat,label(npc.name));group.position.set(npc.x,0,npc.z);scene.add(group);npcs.push(group);}
  const trunk=new THREE.CylinderGeometry(.15,.26,1.7,7),crown=new THREE.ConeGeometry(1.1,2.5,7);
  const trunks=new THREE.InstancedMesh(trunk,new THREE.MeshToonMaterial({color:0x806049}),120),crowns=new THREE.InstancedMesh(crown,new THREE.MeshToonMaterial({color:0x4f9165}),120);
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),scale=new THREE.Vector3(),rotation=new THREE.Quaternion();let count=0;
  for(let i=0;i<160&&count<120;i++){const x=((i*73)%91)-45,z=((i*53+19)%91)-45;if(Math.hypot(x,z)<13||Math.abs(x)>WORLD_LIMIT-2||Math.abs(z)>WORLD_LIMIT-2)continue;const size=.65+(i%5)*.12;position.set(x,.85*size,z);scale.setScalar(size);matrix.compose(position,rotation,scale);trunks.setMatrixAt(count,matrix);position.y=2.5*size;matrix.compose(position,rotation,scale);crowns.setMatrixAt(count,matrix);count++;}trunks.count=crowns.count=count;scene.add(trunks,crowns);
  const flowerGeometry=new THREE.SphereGeometry(.1,6,4),flowers=new THREE.InstancedMesh(flowerGeometry,new THREE.MeshToonMaterial({color:0xffe7a2}),180);
  for(let i=0;i<180;i++){position.set(((i*37)%95)-47,.1,((i*61+7)%95)-47);scale.setScalar(.6+(i%4)*.2);matrix.compose(position,rotation,scale);flowers.setMatrixAt(i,matrix);}scene.add(flowers);
  for(const [x,z] of [[-9,5],[-10,-4],[9,8]]){const house=new THREE.Group();const wall=new THREE.Mesh(new THREE.BoxGeometry(3,2.2,2.7),new THREE.MeshToonMaterial({color:0xf1dfb8}));wall.position.y=1.1;const roof=new THREE.Mesh(new THREE.ConeGeometry(2.6,1.6,4),new THREE.MeshToonMaterial({color:0xb87965}));roof.rotation.y=Math.PI/4;roof.position.y=3;const door=new THREE.Mesh(new THREE.BoxGeometry(.65,1.15,.08),new THREE.MeshToonMaterial({color:0x775444}));door.position.set(0,.6,1.39);house.add(wall,roof,door);house.position.set(x,0,z);scene.add(house);}
  return npcs;
}
