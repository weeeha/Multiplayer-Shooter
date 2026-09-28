import Phaser from 'phaser';
import type {Actor} from '../shared/model';
import {WEAPONS} from '../shared/tuning';
import {armedOrigins} from './Sprites';
import {Gait} from './Gait';

export class ActorView {
  readonly root:Phaser.GameObjects.Container;
  private sprite:Phaser.GameObjects.Image;
  private under:Phaser.GameObjects.Graphics;
  private over:Phaser.GameObjects.Graphics;
  private gait=new Gait();
  private gaitFrame=-1;
  constructor(scene:Phaser.Scene,parent:Phaser.GameObjects.Container,private row:number){
    this.under=scene.add.graphics();this.sprite=scene.add.image(0,0,`character-${row}-1`).setOrigin(.5,1);this.over=scene.add.graphics();
    this.root=scene.add.container(0,0,[this.under,this.sprite,this.over]);parent.add(this.root);
  }
  reset():void {this.gait.reset();this.gaitFrame=-1;}
  visualState(){return {visible:this.root.visible,texture:this.sprite.texture.key,walking:this.gaitFrame>=0};}
  update(a:Actor,time:number,state:string,visible:boolean):void {
    this.root.setVisible(visible);if(!visible)return;
    this.gaitFrame=a.hp>0?this.gait.update(a.pos,time,a.aim):-1;
    const dog=a.kind==='dog',height=dog?28:48;
    const pose=Math.abs(a.aim.y)<.4?1:a.aim.y>0?0:2;
    const flip=a.aim.x<0;
    const armed=a.weapon!=='none';
    const armedRow=a.kind==='player'?a.weapon==='pistol'?0:a.weapon==='ar'?1:2:a.kind==='robot'?3:a.weapon==='ar'?4:5;
    const armedPose=Math.round((Math.atan2(-a.aim.y,Math.abs(a.aim.x))+Math.PI/2)/(Math.PI/4));
    const walkType=a.kind==='player'?`player-${a.weapon}`:a.kind==='scavenger'?a.weapon==='ar'?'scav-ar':'scav-shotgun':a.kind;
    const walking=this.gaitFrame>=0;
    const spriteKey=walking?`walk-${walkType}-${armedPose}-${this.gaitFrame}`:armed?`armed-${armedRow}-${armedPose}`:`character-${this.row}-${pose}`;
    const origin=armedOrigins.get(spriteKey)??.5;
    this.sprite.setTexture(spriteKey).setOrigin((armed||walking)&&flip?1-origin:origin,1).setFlipX(!walking&&a.kind==='zombie'&&pose<2?!flip:flip);
    const frame=this.sprite.frame;this.sprite.setDisplaySize(walking?frame.cutWidth:height*frame.cutWidth/frame.cutHeight,walking?frame.cutHeight:height);
    this.root.setPosition(a.pos.x,a.pos.y).setDepth(a.pos.y);
    this.under.clear();this.over.clear();
    this.under.fillStyle(0x071016,.55).fillEllipse(2,3,dog?32:26,11);
    if(a.hp<=0){this.sprite.setRotation(Math.PI*.48).setTint(0x67747a).setAlpha(.65).setPosition(-8,-4);return;}
    this.sprite.clearTint().setAlpha(1).setRotation(0).setPosition(0,0);
    if(a.kind==='player'){
      this.under.lineStyle(1,0xc6e3ce,.42).strokeEllipse(0,4,28,11);
      if(a.dashRemaining>0)this.under.lineStyle(5,0xb6d1cd,.18).lineBetween(0,2,-a.dashDirection.x*35,2-a.dashDirection.y*35);
    }
    const alert=state==='telegraph'||state==='burst'||state==='chase';
    if(a.weapon!=='none'){
      const gun=WEAPONS[a.weapon],aim=a.aim;
      const recoil=a.shotCooldown>gun.interval-.07?3:0;
      const muzzles=a.kind==='robot'?[[0,-16],[13,-20],[21,-25],[20,-30],[8,-30]]:a.weapon==='pistol'?[[0,-28],[6,-28],[21,-36],[17,-39],[2,-34]]:[[0,-27],[14,-26],[26,-34],[24,-39],[4,-35]];
      const muzzle=muzzles[armedPose],end={x:muzzle[0]*(flip?-1:1)-aim.x*(recoil?1.2:0),y:muzzle[1]};
      const g=this.over;
      if(recoil)this.sprite.x=-aim.x*1.2;
      if(a.shotCooldown>gun.interval-.06){
        g.fillStyle(0xf9b452,.15).fillCircle(end.x,end.y,22);g.fillStyle(0xffcf78,.9).fillTriangle(end.x+aim.x*13,end.y+aim.y*13,end.x-aim.y*5,end.y+aim.x*5,end.x+aim.y*5,end.y-aim.x*5);g.fillStyle(0xfff2c5).fillCircle(end.x,end.y,3);
      }
    }
    if(a.kind!=='player'&&alert){this.over.fillStyle(0xea965f).fillRect(-1,-56,2,6);this.over.fillRect(-1,-48,2,2);}
    if(a.hp<a.maxHp&&a.kind!=='player'){
      this.over.fillStyle(0x13232d,.9).fillRect(-15,-47,30,3);this.over.fillStyle(0xc98b67).fillRect(-15,-47,30*a.hp/a.maxHp,3);
    }
  }
}
