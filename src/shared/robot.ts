import type {World,InputFrame,Enemy} from './model';
import {getBlockers} from './map';
import {canSee} from './visibility';
import {distance,moveCircle,normalized} from './geometry';
import {stepWeapon,applyDamage} from './combat';
import {T} from './tuning';

export function stepRobot(w:World,dt:number):void {
  stepEnemy(w,w.enemies[0],dt);
}
export function stepEnemy(w:World,enemy:Enemy,dt:number):void {
  const a=enemy.actor,b=enemy.brain;
  if(a.hp<=0) {b.mode='dead';return;}
  const walls=getBlockers(w.map);
  const melee=a.weapon==='none';
  const speed=a.kind==='dog'?185:a.kind==='zombie'?62:T.robotSpeed;
  // Keep initial engagements inside the fixed 960×540 gameplay view.
  const sees=w.player.hp>0&&Math.abs(a.pos.y-w.player.pos.y)<=220&&canSee(a.pos,w.player.pos,walls,T.sight);
  const cmd:InputFrame={move:{x:0,y:0},aim:a.aim,fire:false,reloadPressed:a.ammo===0&&a.reserve>0,interactPressed:false,dashPressed:false};
  b.remaining=Math.max(0,b.remaining-dt);
  if(sees) {
    b.lastSeen={...w.player.pos};a.aim=normalized({x:w.player.pos.x-a.pos.x,y:w.player.pos.y-a.pos.y});
    if(b.mode==='patrol'||b.mode==='investigate') {b.mode=melee?'chase':'telegraph';b.remaining=.6;}
  } else if(b.mode==='telegraph'||b.mode==='burst'||b.mode==='chase') {b.mode='investigate';b.remaining=3;}

  if(b.mode==='patrol') {
    const noise=w.noises.find(n=>n.sourceId==='player'&&distance(a.pos,n.pos)<=500);
    if(noise) {b.mode='investigate';b.remaining=3;b.lastSeen={...noise.pos};}
  }
  if(b.mode==='patrol'||b.mode==='investigate') {
    const target=b.mode==='investigate'?b.lastSeen:enemy.patrol[b.waypoint];
    if(target) {
      const d=distance(a.pos,target);
      if(d>4) {
        const dir=normalized({x:target.x-a.pos.x,y:target.y-a.pos.y});a.aim=dir;
        a.pos=moveCircle(a.pos,{x:dir.x*Math.min(d,speed*dt),y:dir.y*Math.min(d,speed*dt)},a.radius,walls.filter(b=>b.movement));
      } else if(b.mode==='patrol') b.waypoint=(b.waypoint+1)%enemy.patrol.length;
    }
    if(b.mode==='investigate'&&b.remaining<=0) {b.mode='patrol';b.lastSeen=null;}
  }
  if(melee){
    if(b.mode==='chase'&&sees){
      const d=distance(a.pos,w.player.pos),reach=a.radius+w.player.radius+8;
      if(d>reach){
        const dir=normalized({x:w.player.pos.x-a.pos.x,y:w.player.pos.y-a.pos.y});
        a.pos=moveCircle(a.pos,{x:dir.x*Math.min(d-reach,speed*dt),y:dir.y*Math.min(d-reach,speed*dt)},a.radius,walls.filter(b=>b.movement));
      } else if(b.remaining<=1e-8){
        applyDamage(w.player,a.kind==='dog'?12:22);b.remaining=a.kind==='dog'?.75:1.25;
      }
    }
    return;
  }
  if(a.weapon==='shotgun'&&sees&&distance(a.pos,w.player.pos)>230){
    const dir=normalized({x:w.player.pos.x-a.pos.x,y:w.player.pos.y-a.pos.y});
    a.pos=moveCircle(a.pos,{x:dir.x*speed*dt,y:dir.y*speed*dt},a.radius,walls.filter(b=>b.movement));
    b.mode='telegraph';b.remaining=.6;stepWeapon(a,cmd,w,dt);return;
  }
  if(b.mode==='telegraph'&&b.remaining<=1e-8&&sees) {b.mode='burst';b.shotsRemaining=a.weapon==='ar'?5:a.weapon==='shotgun'?1:3;}
  if(b.mode==='burst'&&sees) cmd.fire=true;
  const ammoBefore=a.ammo;
  stepWeapon(a,cmd,w,dt);
  if(b.mode==='burst'&&a.ammo<ammoBefore) {
    b.shotsRemaining--;
    if(b.shotsRemaining<=0) {b.mode='telegraph';b.remaining=.8;}
  }
}
