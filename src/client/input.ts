import type Phaser from 'phaser';
import type {InputFrame,Vec2} from '../shared/model';
import {T} from '../shared/tuning';
import {normalized} from '../shared/geometry';
export function aimAtPointer(pos:Vec2,pointerWorld:Vec2):Vec2 {
  // The cursor aims through the torso plane shared by weapons and tracers.
  return normalized({x:pointerWorld.x-pos.x,y:pointerWorld.y+T.visualAimHeight-pos.y});
}
export class GameInput {
  private held=new Set<string>();
  private edges=new Set<string>();
  private firing=false;
  private pointer={x:0,y:0};
  private movedPointer=false;
  private abort=new AbortController();
  constructor(private scene:Phaser.Scene) {
    const options={signal:this.abort.signal};
    window.addEventListener('keydown',e=>{
      if((e.target as HTMLElement)?.closest('button,input,select')) return;
      if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
      if(!this.held.has(e.code)) this.edges.add(e.code);this.held.add(e.code);
    },options);
    window.addEventListener('keyup',e=>this.held.delete(e.code),options);
    window.addEventListener('pointermove',e=>{this.pointer={x:e.clientX,y:e.clientY};this.movedPointer=true;},options);
    scene.game.canvas.addEventListener('pointerdown',e=>{if(e.button===0) this.firing=true;},options);
    window.addEventListener('pointerup',()=>{this.firing=false;},options);
    window.addEventListener('blur',()=>this.clear(),options);
  }
  clear():void {this.held.clear();this.edges.clear();this.firing=false;}
  read(pos:Vec2,previousAim:Vec2):InputFrame {
    const canvas=this.scene.game.canvas.getBoundingClientRect();
    const camera=this.scene.cameras.main;
    const target=camera.getWorldPoint((this.pointer.x-canvas.left)*960/canvas.width,(this.pointer.y-canvas.top)*540/canvas.height);
    const aim=this.movedPointer?aimAtPointer(pos,target):previousAim;
    const has=(...codes:string[])=>codes.some(c=>this.held.has(c))?1:0;
    const frame:InputFrame={grenadePressed:this.edges.has('KeyG'),grenadeTarget:this.movedPointer?{x:target.x,y:target.y}:undefined,move:{x:has('KeyD','ArrowRight')-has('KeyA','ArrowLeft'),y:has('KeyS','ArrowDown')-has('KeyW','ArrowUp')},aim,fire:this.firing,
      reloadPressed:this.edges.has('KeyR'),interactPressed:this.edges.has('KeyE'),dashPressed:this.edges.has('Space'),weaponPressed:this.edges.has('Digit1')?'pistol':this.edges.has('Digit2')?'ar':this.edges.has('Digit3')?'shotgun':undefined};
    this.edges.clear();return frame;
  }
  destroy():void {this.abort.abort();}
}
