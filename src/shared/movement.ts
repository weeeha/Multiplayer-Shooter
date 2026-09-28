import type {Actor,InputFrame,Rect} from './model';
import {moveCircle,normalized} from './geometry';
import {T} from './tuning';

export function stepMovement(a:Actor,input:InputFrame,walls:Rect[],dashEnabled:boolean,dt:number):void {
  if(a.hp<=0) return;
  a.aimTarget=input.aimTarget;
  if(Math.hypot(input.aim.x,input.aim.y)>1e-9) a.aim=normalized(input.aim);
  const length=Math.hypot(input.move.x,input.move.y);
  const dir=length>1 ? normalized(input.move) : input.move;
  a.dashCooldown=Math.max(0,a.dashCooldown-dt);
  if(dashEnabled&&input.dashPressed&&length>0&&a.dashRemaining<=0&&a.dashCooldown<=0) {
    a.dashDirection=normalized(dir); a.dashRemaining=T.dashDuration;
  }
  const dashTime=Math.min(dt,a.dashRemaining);
  const walkTime=dt-dashTime;
  a.pos=moveCircle(a.pos,{
    x:a.dashDirection.x*T.dashSpeed*dashTime+dir.x*T.moveSpeed*walkTime,
    y:a.dashDirection.y*T.dashSpeed*dashTime+dir.y*T.moveSpeed*walkTime,
  },a.radius,walls);
  if(a.dashRemaining>0) {
    a.dashRemaining=Math.max(0,a.dashRemaining-dt);
    if(a.dashRemaining===0) a.dashCooldown=T.dashCooldown;
  }
}
