import Phaser from 'phaser';
import type {World,Vec2} from '../shared/model';
import {getBlockers} from '../shared/map';
import {canSee,visibilityPolygon} from '../shared/visibility';
import {T} from '../shared/tuning';
import {terrainTexture,roofTexture} from './art';
import {ActorView} from './ActorView';
import {CombatEffects} from './CombatEffects';

export class WorldView {
  private maskGraphics:Phaser.GameObjects.Graphics;
  private memoryGraphics:Phaser.GameObjects.Graphics;
  private dynamic:Phaser.GameObjects.Graphics;
  private own:Phaser.GameObjects.Graphics;
  private playerView:ActorView;
  private enemyViews:ActorView[]=[];
  private effects=new CombatEffects();
  private effectsGraphics:Phaser.GameObjects.Graphics;
  private doors:Phaser.GameObjects.Graphics;
  private debug:Phaser.GameObjects.Graphics;
  private roofs:Phaser.GameObjects.Image[]=[];
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
        const crop=scene.textures.createCanvas(key,b.w+12,b.h+28)!;
        crop.context.drawImage(scene.textures.get(texture).getSourceImage() as HTMLCanvasElement,b.x-4,b.y-12,b.w+12,b.h+28,0,0,b.w+12,b.h+28);crop.refresh();
      }
      this.cars.push({image:scene.add.image(b.x-4,b.y-12,key).setOrigin(0).setDepth(2),rect:b,seen:false});
    }
    for(const b of w.map.buildings)this.roofs.push(scene.add.image(b.x,b.y-14,roofTexture(scene,b)).setOrigin(0).setDepth(4));
    const actors=scene.add.container(0,0).setDepth(3).enableFilters();
    actors.filters!.external.addMask(this.maskGraphics,false,scene.cameras.main);
    this.dynamic=scene.add.graphics();actors.add(this.dynamic);
    this.enemyViews=w.enemies.map((_,i)=>new ActorView(scene,actors,[1,2,3,4,5][i]));
    this.effectsGraphics=scene.add.graphics().setDepth(7);
    const playerRoot=scene.add.container(0,0).setDepth(6);
    this.playerView=new ActorView(scene,playerRoot,0);
    this.own=scene.add.graphics().setDepth(6);
    this.debug=scene.add.graphics().setDepth(9);
    this.labels=w.enemies.map(()=>scene.add.text(0,0,'',{fontFamily:'monospace',fontSize:'8px',color:'#dfceae',backgroundColor:'#172019cc',padding:{x:4,y:3}}).setOrigin(.5,1).setDepth(7));
  }
  reset(w:World):void {this.lastWorld=w;this.explored.clear();this.memoryGraphics.clear();this.lastPosition={x:-1000,y:-1000};for(const car of this.cars)car.seen=false;this.effects.reset();this.playerView.reset();for(const actor of this.enemyViews)actor.reset();}
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
      if(d.open)this.doors.fillStyle(0x829da3).fillRect(d.x-2,d.y,5,52);
      else {this.doors.fillStyle(0x50727e).fillRect(d.x,d.y,d.w,d.h);this.doors.lineStyle(1,0xbfc8b8).lineBetween(d.x,d.y+2,d.x+d.w,d.y+2);}
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
      this.enemyViews[i].update(e.actor,w.time,e.brain.mode,visible);
      const name=e.actor.kind==='dog'?'RABID DOG':e.actor.kind==='zombie'?'ZOMBIE':e.actor.kind==='robot'?'PISTOL / ROBOT':`${e.actor.weapon==='ar'?'AR':'SHOTGUN'} / SCAV`;
      this.labels[i].setVisible(visible&&e.actor.hp>0).setPosition(e.actor.pos.x,e.actor.pos.y-61).setText(name);
    });
    for(const p of w.projectiles) {
      const n=Math.hypot(p.velocity.x,p.velocity.y);
      this.dynamic.lineStyle(2,p.ownerId==='player'?0xf0dd9d:0xe29969,1).lineBetween(p.pos.x,p.pos.y-T.visualAimHeight,p.pos.x-p.velocity.x/n*15,p.pos.y-T.visualAimHeight-p.velocity.y/n*15);
    }
    this.playerView.update(w.player,w.time,'player',true);
    this.effects.render(this.effectsGraphics,w);
    this.debug.clear();
    if(debug){this.debug.lineStyle(1,0xf6935a,.75);for(const b of blockers)this.debug.strokeRect(b.x,b.y,b.w,b.h);this.debug.lineStyle(1,0xbbda8a,.8).strokePoints(this.polygon.map(p=>new Phaser.Math.Vector2(p.x,p.y)),true);this.debug.strokeCircle(pos.x,pos.y,w.player.radius);}
  }
  visualState():{direction:string;spriteCount:number;particles:number}{return {direction:'cold-relay',spriteCount:this.enemyViews.length+1,particles:this.effects.count};}
}
