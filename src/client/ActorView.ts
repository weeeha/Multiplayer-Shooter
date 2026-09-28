import Phaser from 'phaser';
import type {Actor,CombatEvent} from '../shared/model';
import {WEAPONS} from '../shared/tuning';
import {armedOrigins} from './Sprites';
import {Gait} from './Gait';
import {muzzleOffset,weaponBearing} from '../shared/muzzle';

export class ActorView {
  readonly root:Phaser.GameObjects.Container;
  private sprite:Phaser.GameObjects.Image;
  private under:Phaser.GameObjects.Graphics;
  private over:Phaser.GameObjects.Graphics;
  private gait=new Gait();
  private gaitFrame=-1;
  private biting=false;
  private deathAt:number|null=null;
  private deathProgress=0;
  private lastLive:{texture:string;flip:boolean;origin:number;width:number;height:number}|null=null;
  constructor(scene:Phaser.Scene,parent:Phaser.GameObjects.Container,private row:number){
    this.under=scene.add.graphics();this.sprite=scene.add.image(0,0,`character-${row}-1`).setOrigin(.5,1);this.over=scene.add.graphics();
    this.root=scene.add.container(0,0,[this.under,this.sprite,this.over]);parent.add(this.root);
  }
  reset():void {this.gait.reset();this.gaitFrame=-1;this.biting=false;this.deathAt=null;this.deathProgress=0;this.lastLive=null;}
  visualState(){return {visible:this.root.visible,texture:this.sprite.texture.key,walking:this.gaitFrame>=0,biting:this.biting,deathProgress:this.deathProgress,rotation:this.sprite.rotation,offset:{x:this.sprite.x,y:this.sprite.y}};}
  update(a:Actor,time:number,state:string,visible:boolean,bite?:CombatEvent,death?:CombatEvent):void {
    this.biting=a.kind==='dog'&&a.hp>0&&bite!==undefined&&time-bite.time<.4;
    this.root.setVisible(visible);if(!visible)return;
    this.gaitFrame=a.hp>0?this.gait.update(a.pos,time,a.aim):-1;
    const dog=a.kind==='dog',spider=a.kind==='spider',height=spider?86:dog?28:48;
    const pose=Math.abs(a.aim.y)<.4?1:a.aim.y>0?0:2;
    const flip=a.aim.x<0;
    const armed=a.weapon!=='none';
    const armedRow=a.kind==='player'?a.weapon==='pistol'?0:a.weapon==='ar'?1:2:a.kind==='robot'?3:a.weapon==='ar'?4:5;
    const armedPose=weaponBearing(a.aim);
    const walkType=a.kind==='player'?`player-${a.weapon}`:a.kind==='scavenger'?a.weapon==='ar'?'scav-ar':'scav-shotgun':a.kind;
    const walking=this.gaitFrame>=0;
    const rail=a.weapon==='railgun';
    const spriteKey=rail?`walk-player-railgun-${armedPose}-${walking?this.gaitFrame:0}`:spider?`walk-spider-${armedPose}-${walking?this.gaitFrame:0}`:walking?`walk-${walkType}-${armedPose}-${this.gaitFrame}`:armed?`armed-${armedRow}-${armedPose}`:`character-${this.row}-${pose}`;
    const origin=armedOrigins.get(spriteKey)??.5;
    this.sprite.setTexture(spriteKey).setOrigin((armed||walking)&&flip?1-origin:origin,1).setFlipX(!walking&&a.kind==='zombie'&&pose<2?!flip:flip);
    const frame=this.sprite.frame;this.sprite.setDisplaySize((walking||spider||rail)?frame.cutWidth:height*frame.cutWidth/frame.cutHeight,(walking||spider||rail)?frame.cutHeight:height);
    this.root.setPosition(a.pos.x,a.pos.y).setDepth(a.pos.y);
    this.under.clear();this.over.clear();
    this.under.fillStyle(0x071016,.55).fillEllipse(2,3,spider?80:dog?32:26,spider?24:11);
    if(a.hp<=0){
      this.deathAt??=death?.time??time;
      this.deathProgress=Math.min(1,Math.max(0,(time-this.deathAt)/.48));
      const fall=1-Math.pow(1-this.deathProgress,3),side=a.aim.x<0?-1:1,metal=a.kind==='robot'||spider;
      if(this.lastLive){const last=this.lastLive;this.sprite.setTexture(last.texture).setFlipX(last.flip).setOrigin(last.origin,1).setDisplaySize(last.width,last.height);}
      const width=this.sprite.displayWidth,height=this.sprite.displayHeight;
      this.sprite.setDisplaySize(width*(1+(dog?.12:metal?.1:0)*fall),height*(1-(dog?.52:metal?.35:.12)*fall));
      this.sprite.setRotation(side*(dog?.18:metal?.28:Math.PI*.48)*fall).setAlpha(1-.35*fall).setPosition(side*(dog?4:metal?3:12)*fall,(dog?3:-4)*fall);
      if(this.deathProgress>.5)this.sprite.setTint(0x777368);else this.sprite.clearTint();
      return;
    }
    this.lastLive={texture:spriteKey,flip:this.sprite.flipX,origin:this.sprite.originX,width:this.sprite.displayWidth,height:this.sprite.displayHeight};
    this.sprite.clearTint().setAlpha(1).setRotation(0).setPosition(0,0);
    if(this.biting&&bite){
      const age=time-bite.time,windup=age<.16;
      const thrust=windup?-4*Math.sin(age/.16*Math.PI/2):12*Math.sin(Math.min(1,(age-.16)/.24)*Math.PI);
      this.sprite.setPosition(bite.direction.x*thrust,bite.direction.y*thrust-(windup?0:3*Math.sin((age-.16)/.24*Math.PI)));
      if(windup)this.sprite.setDisplaySize(this.sprite.displayWidth,this.sprite.displayHeight*.9);
      else if(age<.28){
        const x=bite.direction.x*18,y=-10+bite.direction.y*14;
        this.over.lineStyle(1.5,0xe7d6b0,(1-(age-.16)/.12)*.8);
        for(const side of [-1,1])this.over.lineBetween(x-bite.direction.y*side*5,y+bite.direction.x*side*5,x+bite.direction.x*6,y+bite.direction.y*6);
      }
    }
    if(a.kind==='player'){
      this.under.lineStyle(1,0xc6e3ce,.42).strokeEllipse(0,4,28,11);
      if(a.dashRemaining>0)this.under.lineStyle(5,0xb6d1cd,.18).lineBetween(0,2,-a.dashDirection.x*35,2-a.dashDirection.y*35);
    }
    const alert=state==='telegraph'||state==='burst'||state==='chase'||state==='rail-charge';
    if(a.weapon!=='none'&&!spider){
      const gun=WEAPONS[a.weapon],aim=a.aim;
      const recoil=a.shotCooldown>gun.interval-.07?3:0;
      const end=muzzleOffset(a);
      const g=this.over;
      if(recoil)this.sprite.x=-aim.x*1.2;
      if(a.shotCooldown>gun.interval-.06){
        g.fillStyle(rail?0x91e8ff:0xf9b452,.15).fillCircle(end.x,end.y,22);g.fillStyle(rail?0x91e8ff:0xffcf78,.9).fillTriangle(end.x+aim.x*13,end.y+aim.y*13,end.x-aim.y*5,end.y+aim.x*5,end.x+aim.y*5,end.y-aim.x*5);g.fillStyle(0xfff2c5).fillCircle(end.x,end.y,3);
      }
    }
    if(a.kind!=='player'&&alert){this.over.fillStyle(0xea965f).fillRect(-1,spider?-99:-56,2,6);this.over.fillRect(-1,spider?-91:-48,2,2);}
    if(a.hp<a.maxHp&&a.kind!=='player'){
      this.over.fillStyle(0x13232d,.9).fillRect(-15,spider?-88:-47,30,3);this.over.fillStyle(0xc98b67).fillRect(-15,spider?-88:-47,30*a.hp/a.maxHp,3);
    }
  }
}
