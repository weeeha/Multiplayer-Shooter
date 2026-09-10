import Phaser from 'phaser';
import type {World,Actor,Vec2} from '../shared/model';
import {getBlockers} from '../shared/map';
import {canSee,visibilityPolygon} from '../shared/visibility';
import {T,WEAPONS} from '../shared/tuning';
import {terrainTexture} from './art';

export class WorldView {
  private maskGraphics:Phaser.GameObjects.Graphics;
  private memoryGraphics:Phaser.GameObjects.Graphics;
  private dynamic:Phaser.GameObjects.Graphics;
  private own:Phaser.GameObjects.Graphics;
  private doors:Phaser.GameObjects.Graphics;
  private debug:Phaser.GameObjects.Graphics;
  private roofs:Phaser.GameObjects.Container[]=[];
  private cars:{image:Phaser.GameObjects.Image;rect:World['map']['blockers'][number];seen:boolean}[]=[];
  private labels:Phaser.GameObjects.Text[]=[];
  private explored=new Set<number>();
  private lastPosition={x:-1000,y:-1000};
  private lastDoors='';
  private lastWorld:World;
  private polygon:Vec2[]=[];
  constructor(private scene:Phaser.Scene,w:World) {
    this.lastWorld=w;
    const texture=terrainTexture(scene,w.map);
    scene.add.image(0,0,texture).setOrigin(0).setAlpha(.1);
    this.memoryGraphics=scene.add.graphics().setVisible(false);
    const memory=scene.add.image(0,0,texture).setOrigin(0).setAlpha(.42).enableFilters();
    memory.filters!.external.addMask(this.memoryGraphics,false,scene.cameras.main);
    this.maskGraphics=scene.add.graphics().setVisible(false);
    const current=scene.add.image(0,0,texture).setOrigin(0).enableFilters();
    current.filters!.external.addMask(this.maskGraphics,false,scene.cameras.main);
    this.doors=scene.add.graphics().setDepth(1).enableFilters();
    this.doors.filters!.external.addMask(this.maskGraphics,false,scene.cameras.main);
    for(const b of w.map.blockers.filter(b=>b.id.startsWith('car'))) {
      const key=`prop-${b.id}`;
      if(!scene.textures.exists(key)){
        const crop=scene.textures.createCanvas(key,b.w+12,b.h+16)!;
        crop.context.drawImage(scene.textures.get(texture).getSourceImage() as HTMLCanvasElement,b.x-4,b.y-4,b.w+12,b.h+16,0,0,b.w+12,b.h+16);crop.refresh();
      }
      this.cars.push({image:scene.add.image(b.x-4,b.y-4,key).setOrigin(0).setDepth(2),rect:b,seen:false});
    }
    for(const b of w.map.buildings) {
      const g=scene.add.graphics();
      g.fillStyle(0x101810,.85).fillRect(9,0,b.w+5,b.h+12);
      g.fillStyle(0x444d3d).fillRect(0,-14,b.w,b.h);
      g.fillStyle(0x2a352b).fillRect(0,b.h-14,b.w,14);
      g.lineStyle(1,0x6c755b,.6);
      for(let x=0;x<b.w;x+=13)g.lineBetween(x,-14,x,b.h-14);
      g.lineStyle(2,0x94997b,.55).strokeRect(0,-14,b.w,b.h);
      g.fillStyle(0x303d32).fillRect(45,35,110,55);
      g.lineStyle(2,0x656f59).strokeRect(45,35,110,55);
      for(let y=42;y<85;y+=7)g.lineBetween(50,y,148,y);
      const text=scene.add.text(30,b.h-60,b.label,{fontFamily:'monospace',fontSize:'13px',color:'#b2b69a'});
      this.roofs.push(scene.add.container(b.x,b.y,[g,text]).setDepth(4));
    }
    this.dynamic=scene.add.graphics().setDepth(3).enableFilters();
    this.dynamic.filters!.external.addMask(this.maskGraphics,false,scene.cameras.main);
    this.own=scene.add.graphics().setDepth(6);
    this.debug=scene.add.graphics().setDepth(9);
    this.labels=w.enemies.map(()=>scene.add.text(0,0,'',{fontFamily:'monospace',fontSize:'8px',color:'#dfceae',backgroundColor:'#172019cc',padding:{x:4,y:3}}).setOrigin(.5,1).setDepth(7));
  }
  reset(w:World):void {this.lastWorld=w;this.explored.clear();this.memoryGraphics.clear();this.lastPosition={x:-1000,y:-1000};for(const car of this.cars)car.seen=false;}
  render(w:World,debug:boolean,dt:number):void {
    if(w!==this.lastWorld)this.reset(w);
    const blockers=getBlockers(w.map),pos=w.player.pos;
    const doorsKey=w.map.doors.map(d=>Number(d.open)).join('');
    if(Math.hypot(pos.x-this.lastPosition.x,pos.y-this.lastPosition.y)>1||doorsKey!==this.lastDoors) {
      this.lastPosition={...pos};this.lastDoors=doorsKey;
      this.polygon=visibilityPolygon(pos,blockers,T.sight);
      this.maskGraphics.clear().fillStyle(0xffffff).fillPoints(this.polygon.map(p=>new Phaser.Math.Vector2(p.x,p.y)),true);
      let changed=false;
      for(let cy=Math.max(0,Math.floor((pos.y-T.sight)/32));cy<Math.min(40,Math.ceil((pos.y+T.sight)/32));cy++)for(let cx=Math.max(0,Math.floor((pos.x-T.sight)/32));cx<Math.min(50,Math.ceil((pos.x+T.sight)/32));cx++) {
        const id=cy*50+cx;
        if(!this.explored.has(id)&&canSee(pos,{x:cx*32+16,y:cy*32+16},blockers,T.sight)) {this.explored.add(id);changed=true;}
      }
      if(changed){this.memoryGraphics.clear().fillStyle(0xffffff);for(const id of this.explored)this.memoryGraphics.fillRect((id%50)*32,Math.floor(id/50)*32,32,32);}
    }
    this.doors.clear();
    for(const car of this.cars){
      const b=car.rect;
      const points=[{x:b.x-1,y:b.y+b.h/2},{x:b.x+b.w+1,y:b.y+b.h/2},{x:b.x+b.w/2,y:b.y-1},{x:b.x+b.w/2,y:b.y+b.h+1}];
      const visible=points.some(p=>canSee(pos,p,blockers,T.sight));
      car.seen ||= visible;car.image.setAlpha(visible?1:car.seen?.38:.08);
    }
    for(const d of w.map.doors) {
      if(d.open)this.doors.fillStyle(0x92946b).fillRect(d.x-2,d.y,5,52);
      else {this.doors.fillStyle(0x8f8050).fillRect(d.x,d.y,d.w,d.h);this.doors.lineStyle(1,0xc1b077).lineBetween(d.x,d.y+2,d.x+d.w,d.y+2);}
    }
    w.map.buildings.forEach((b,i)=>{
      const inside=pos.x>b.x&&pos.x<b.x+b.w&&pos.y>b.y&&pos.y<b.y+b.h;
      let seen=inside;
      for(let x=b.x+32;!seen&&x<b.x+b.w-16;x+=48)for(let y=b.y+32;!seen&&y<b.y+b.h-16;y+=48)seen=canSee(pos,{x,y},blockers,T.sight);
      const target=seen?.08:.82,roof=this.roofs[i];roof.setAlpha(Phaser.Math.Linear(roof.alpha,target,Math.min(1,dt*10)));
    });
    this.dynamic.clear();this.own.clear();
    w.enemies.forEach((e,i)=>{
      const visible=canSee(pos,e.actor.pos,blockers,T.sight);
      if(visible)this.drawActor(this.dynamic,e.actor,w.time,e.brain.mode);
      const name=e.actor.kind==='dog'?'RABID DOG':e.actor.kind==='zombie'?'ZOMBIE':e.actor.kind==='robot'?'PISTOL / ROBOT':`${e.actor.weapon==='ar'?'AR':'SHOTGUN'} / SCAV`;
      this.labels[i].setVisible(visible&&e.actor.hp>0).setPosition(e.actor.pos.x,e.actor.pos.y-54).setText(name);
    });
    for(const p of w.projectiles) {
      const n=Math.hypot(p.velocity.x,p.velocity.y);
      this.dynamic.lineStyle(2,p.ownerId==='player'?0xf0dd9d:0xe29969,1).lineBetween(p.pos.x,p.pos.y-15,p.pos.x-p.velocity.x/n*15,p.pos.y-15-p.velocity.y/n*15);
    }
    this.drawActor(this.own,w.player,w.time,'player');
    this.debug.clear();
    if(debug){this.debug.lineStyle(1,0xf6935a,.75);for(const b of blockers)this.debug.strokeRect(b.x,b.y,b.w,b.h);this.debug.lineStyle(1,0xbbda8a,.8).strokePoints(this.polygon.map(p=>new Phaser.Math.Vector2(p.x,p.y)),true);this.debug.strokeCircle(pos.x,pos.y,w.player.radius);}
  }
  private drawActor(g:Phaser.GameObjects.Graphics,a:Actor,time:number,state:string):void {
    const {x,y}=a.pos;
    if(a.hp<=0){g.fillStyle(0x151b17).fillEllipse(x,y,32,15);g.fillStyle(0x596257).fillRect(x-13,y-8,20,9);g.lineStyle(2,0x97805c).lineBetween(x-10,y-12,x+14,y+3);return;}
    const robot=a.kind==='robot',zombie=a.kind==='zombie',scav=a.kind==='scavenger',alert=state==='telegraph'||state==='burst'||state==='chase';
    if(a.kind==='dog'){
      const aim=a.aim,side={x:-aim.y,y:aim.x};
      const point=(forward:number,lateral:number)=>new Phaser.Math.Vector2(x+aim.x*forward+side.x*lateral,y-8+aim.y*forward+side.y*lateral);
      g.fillStyle(0x07110c,.7).fillEllipse(x,y+3,34,15);
      g.lineStyle(5,0x38281f).lineBetween(x-9,y-1,x-11,y+6).lineBetween(x+8,y-1,x+11,y+5);
      g.fillStyle(0x98694c).fillPoints([point(-16,-7),point(10,-7),point(17,-4),point(17,4),point(10,7),point(-16,7)],true);
      g.lineStyle(3,0xb79a71).lineBetween(x-aim.x*13,y-8-aim.y*13,x-aim.x*23,y-8-aim.y*23);
      const snout=point(20,0);g.fillStyle(0xdfc9a2).fillCircle(snout.x,snout.y,3);
      for(const side of [-1,1]){const eye=point(12,side*4);g.fillStyle(0xe46f4f).fillCircle(eye.x,eye.y,2);}
      if(alert)g.lineStyle(1,0xeb9b65,.5).strokeEllipse(x,y-8,40,26);
      this.drawHealth(g,a);return;
    }
    g.fillStyle(0x07110c,.7).fillEllipse(x+3,y+3,31,14);
    if(a.dashRemaining>0)g.lineStyle(5,0xcada9f,.22).lineBetween(x,y,x-a.dashDirection.x*32,y-a.dashDirection.y*32);
    g.fillStyle(0x222c23).fillRect(x-8,y-7,6,11).fillRect(x+3,y-7,6,11);
    g.fillStyle(robot?0x737f74:zombie?0x64794b:scav?0x9d7756:0x839267).fillRoundedRect(x-11,y-23,22,19,3);
    g.fillStyle(robot?0x394e44:zombie?0x394a35:scav?0x50392e:0x4b5d3b).fillRect(x-10,y-16,20,8);
    g.fillStyle(robot?0xadb9a6:zombie?0x96a67b:scav?0xb89570:0xc0be86).fillRoundedRect(x-7,y-30,14,12,3);
    g.fillStyle(robot?(alert?0xf39a60:0xc7d692):0x2a3a2c).fillRect(x-5,y-26,10,3);
    const aim=a.aim;
    if(zombie){
      g.lineStyle(5,0x89956b).lineBetween(x-9,y-18,x-9+aim.x*18,y-18+aim.y*18).lineBetween(x+9,y-18,x+9+aim.x*18,y-18+aim.y*18);
      g.fillStyle(0x843e31).fillRect(x-4,y-15,5,7);
    }else{
      const length=a.weapon==='ar'?34:a.weapon==='shotgun'?38:25;
      g.lineStyle(a.weapon==='shotgun'?6:5,0x192822).lineBetween(x+aim.x*4,y-15+aim.y*4,x+aim.x*length,y-15+aim.y*length);
      g.lineStyle(2,0x91a392).lineBetween(x+aim.x*15,y-15+aim.y*15,x+aim.x*(length+1),y-15+aim.y*(length+1));
      if(a.weapon!=='none'&&a.shotCooldown>WEAPONS[a.weapon].interval-.06)g.fillStyle(0xf6ddb0).fillCircle(x+aim.x*(length+5),y-15+aim.y*(length+5),4);
    }
    if(a.kind!=='player'&&alert){g.lineStyle(1,0xea9f65,.7).strokeCircle(x,y-13,24+Math.sin(time*15)*2);g.fillStyle(0xeaa16c).fillRect(x-1,y-49,2,7);}
    if(a.kind==='player'){g.lineStyle(1,0xd5e3aa,.5).strokeEllipse(x,y+4,30,12);}
    if(a.kind!=='player')this.drawHealth(g,a);
  }
  private drawHealth(g:Phaser.GameObjects.Graphics,a:Actor):void {
    if(a.hp<a.maxHp){g.fillStyle(0x18271c).fillRect(a.pos.x-16,a.pos.y-42,32,3);g.fillStyle(0xd4b37c).fillRect(a.pos.x-16,a.pos.y-42,32*a.hp/a.maxHp,3);}
  }
}
