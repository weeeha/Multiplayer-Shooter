import {createWorld,stepWorld} from '../shared/simulation';
import {T} from '../shared/tuning';
import type {InputFrame,WeaponId,Vec2} from '../shared/model';
export class LocalSession {
  world=createWorld();
  mode:'entry'|'playing'|'dead'='entry';
  private accumulator=0;
  private edges:{grenadePressed?:boolean;grenadeTarget?:Vec2;reloadPressed:boolean;interactPressed:boolean;dashPressed:boolean;weaponPressed?:WeaponId}={grenadePressed:false,reloadPressed:false,interactPressed:false,dashPressed:false};
  start():void {const dash=this.world.dashEnabled;this.world=createWorld();this.world.dashEnabled=dash;this.mode='playing';this.accumulator=0;this.clearEdges();}
  clearEdges():void {this.edges={grenadePressed:false,reloadPressed:false,interactPressed:false,dashPressed:false};}
  advance(ms:number,input:InputFrame):void {
    if(this.mode!=='playing'||!Number.isFinite(ms)||ms<0) return;
    this.edges.reloadPressed ||= input.reloadPressed;this.edges.interactPressed ||= input.interactPressed;this.edges.dashPressed ||= input.dashPressed;
    if(input.grenadePressed){this.edges.grenadePressed=true;this.edges.grenadeTarget=input.grenadeTarget;}
    if(input.weaponPressed)this.edges.weaponPressed=input.weaponPressed;
    this.accumulator+=Math.min(ms,10000)/1000;
    while(this.accumulator+1e-9>=T.step&&this.mode==='playing') {
      stepWorld(this.world,{...input,...this.edges},T.step);this.clearEdges();this.accumulator-=T.step;
      if(this.world.player.hp<=0) this.mode='dead';
    }
  }
}
