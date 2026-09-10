import Phaser from 'phaser';
import type {Actor} from '../shared/model';
import {T,WEAPONS} from '../shared/tuning';

export class ActorView {
  readonly root:Phaser.GameObjects.Container;
  private sprite:Phaser.GameObjects.Image;
  private under:Phaser.GameObjects.Graphics;
  private over:Phaser.GameObjects.Graphics;
  private previous={x:0,y:0};
  private walkPhase=0;
  private movingUntil=0;
  constructor(scene:Phaser.Scene,parent:Phaser.GameObjects.Container,private row:number){
    this.under=scene.add.graphics();this.sprite=scene.add.image(0,0,`character-${row}-1`).setOrigin(.5,1);this.over=scene.add.graphics();
    this.root=scene.add.container(0,0,[this.under,this.sprite,this.over]);parent.add(this.root);
  }
  reset():void {this.previous={x:0,y:0};this.walkPhase=0;this.movingUntil=0;}
  update(a:Actor,time:number,state:string,visible:boolean):void {
    this.root.setVisible(visible);if(!visible)return;
    const moved=Math.hypot(a.pos.x-this.previous.x,a.pos.y-this.previous.y);this.previous={...a.pos};
    if(moved>.1&&moved<80){this.walkPhase+=moved*.13;this.movingUntil=time+.08;}
    const dog=a.kind==='dog',height=dog?28:48;
    const pose=Math.abs(a.aim.y)<.4?1:a.aim.y>0?0:2;
    const flip=a.aim.x<0;
    this.sprite.setTexture(`character-${this.row}-${pose}`).setFlipX(a.kind==='zombie'&&pose<2?!flip:flip);
    const frame=this.sprite.frame;this.sprite.setDisplaySize(height*frame.cutWidth/frame.cutHeight,height);
    this.root.setPosition(a.pos.x,a.pos.y).setDepth(a.pos.y);
    this.under.clear();this.over.clear();
    this.under.fillStyle(0x071016,.55).fillEllipse(2,3,dog?32:26,11);
    if(a.hp<=0){this.sprite.setRotation(Math.PI*.48).setTint(0x67747a).setAlpha(.65).setPosition(-8,-4);return;}
    this.sprite.clearTint().setAlpha(1).setRotation(0).setPosition(0,time<this.movingUntil?-Math.abs(Math.sin(this.walkPhase))*(dog?2:1.3):0);
    if(a.kind==='player'){
      this.under.lineStyle(1,0xc6e3ce,.42).strokeEllipse(0,4,28,11);
      if(a.dashRemaining>0)this.under.lineStyle(5,0xb6d1cd,.18).lineBetween(0,2,-a.dashDirection.x*35,2-a.dashDirection.y*35);
    }
    const alert=state==='telegraph'||state==='burst'||state==='chase';
    if(a.weapon!=='none'){
      const gun=WEAPONS[a.weapon],aim=a.aim,length=a.weapon==='pistol'?21:a.weapon==='ar'?30:34;
      const recoil=a.shotCooldown>gun.interval-.07?3:0;
      const pivot={x:aim.x*(7-recoil),y:-T.visualAimHeight+aim.y*(7-recoil)},end={x:aim.x*(length-recoil),y:-T.visualAimHeight+aim.y*(length-recoil)};
      const g=this.over;
      g.lineStyle(a.weapon==='shotgun'?5:4,0x101b23).lineBetween(pivot.x,pivot.y,end.x,end.y);
      g.lineStyle(1.5,0x91a3a8).lineBetween(pivot.x,pivot.y-1,end.x,end.y-1);
      if(a.weapon!=='pistol')g.lineStyle(4,0x8e6544).lineBetween(aim.x*12,-T.visualAimHeight+aim.y*12,aim.x*19,-T.visualAimHeight+aim.y*19);
      if(a.weapon==='ar')g.lineStyle(3,0x252f35).lineBetween(aim.x*13,-T.visualAimHeight+aim.y*13,aim.x*13-aim.y*6,-T.visualAimHeight+aim.y*13+aim.x*6);
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
