import * as THREE from 'three';

type Action = {role:string;skill:boolean;x:number;z:number;targetX:number;targetZ:number};
type Effect = { group:THREE.Group; start:number; duration:number; update:(progress:number)=>void };

export class SkillEffects {
  private effects: Effect[] = [];
  constructor(private scene: THREE.Scene) {}
  spawn(action: Action): void {
    const {role,skill,x,z,targetX,targetZ}=action;
    const group=new THREE.Group();this.scene.add(group);
    const color=role==='mage'?0xa989ff:role==='archer'?0x8ff5a6:0xffe59a;
    const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false});
    const duration=skill?650:360;
    if(role==='sword') {
      const arc=new THREE.Mesh(new THREE.RingGeometry(.65,skill?1.05:.82,32,1,0,Math.PI*1.25),material);
      arc.position.set(x,1,z);arc.rotation.y=Math.atan2(targetX-x,targetZ-z);group.add(arc);
      this.effects.push({group,start:performance.now(),duration,update:t=>{arc.rotation.z=-1+t*2;arc.scale.setScalar(.7+t*.6);material.opacity=(1-t)*.9;}});
    } else {
      const orb=new THREE.Mesh(new THREE.SphereGeometry(role==='mage'?(skill?.24:.14):.09,12,8),material);group.add(orb);
      const ring=new THREE.Mesh(new THREE.RingGeometry(.35,.45,24),material);ring.rotation.x=-Math.PI/2;ring.position.set(targetX,.08,targetZ);ring.visible=skill;group.add(ring);
      this.effects.push({group,start:performance.now(),duration,update:t=>{const travel=Math.min(1,t*1.8);orb.position.set(x+(targetX-x)*travel,1+Math.sin(travel*Math.PI)*.35,z+(targetZ-z)*travel);ring.scale.setScalar(.4+t*1.5);material.opacity=1-t;}});
    }
  }
  update(now:number):void {
    this.effects=this.effects.filter(effect=>{
      const progress=Math.min(1,(now-effect.start)/effect.duration);effect.update(progress);
      if(progress<1)return true;
      this.scene.remove(effect.group);effect.group.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material.dispose());}});return false;
    });
  }
}
