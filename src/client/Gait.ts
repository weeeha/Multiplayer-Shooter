import type {Vec2} from '../shared/model';
export class Gait {
 private previous:Vec2|null=null;
 private phase=0;
 private until=0;
 reset():void {this.previous=null;this.phase=0;this.until=0;}
 update(pos:Vec2,time:number,aim:Vec2):number {
  if(this.previous){const dx=pos.x-this.previous.x,dy=pos.y-this.previous.y,d=Math.hypot(dx,dy);
   if(d>.05&&d<80){this.phase+=d/22*(dx*aim.x+dy*aim.y<0?-1:1);this.until=time+.08;}
   else if(d>=80)this.until=0;
  }
  this.previous={...pos};return time<this.until?((Math.floor(this.phase)%4)+4)%4:-1;
 }
}
