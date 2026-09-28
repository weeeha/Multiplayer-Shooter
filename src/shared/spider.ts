import type {World,Enemy} from './model';
import {getBlockers} from './map';
import {distance,normalized,moveCircle,segmentRectFraction} from './geometry';
import {canSee} from './visibility';
import {muzzlePosition,railMuzzlePosition} from './muzzle';

export function stepSpider(w:World,e:Enemy,dt:number):void{
 const a=e.actor,b=e.brain,walls=getBlockers(w.map);if(a.hp<=0){b.mode='dead';return;}
 b.remaining=Math.max(0,b.remaining-dt);a.shotCooldown=Math.max(0,a.shotCooldown-dt);
 const sees=w.player.hp>0&&Math.abs(a.pos.y-w.player.pos.y)<=220&&canSee(a.pos,w.player.pos,walls,420),d=distance(a.pos,w.player.pos);
 const move=(target:{x:number;y:number})=>{const dir=normalized({x:target.x-a.pos.x,y:target.y-a.pos.y});a.aim=dir;a.pos=moveCircle(a.pos,{x:dir.x*65*dt,y:dir.y*65*dt},a.radius,walls.filter(w=>w.movement));};
 const fire=(rail:boolean)=>{
   const pos=rail?railMuzzlePosition(a):muzzlePosition(a),target=b.lastSeen??w.player.pos,direction=normalized({x:target.x-pos.x,y:target.y-pos.y});
   if(walls.some(wall=>wall.shots&&segmentRectFraction(a.pos,pos,wall)!==null))return;
   w.events.push({id:w.nextEventId++,time:w.time,kind:'shot',attack:rail?'rail':undefined,pos,direction,actorId:a.id,material:'metal',weapon:'ar'});
   w.projectiles.push({id:w.nextProjectileId++,ownerId:a.id,pos:{...pos},velocity:{x:direction.x*(rail?1800:1050),y:direction.y*(rail?1800:1050)},damage:rail?65:8,remaining:.6,rail});
   a.shotCooldown=.1;
 };
 if(!sees){b.mode='patrol';b.remaining=0;const target=e.patrol[b.waypoint];if(distance(a.pos,target)<8)b.waypoint=(b.waypoint+1)%e.patrol.length;else move(target);return;}
 if(b.mode==='rail-charge'){
   if(b.remaining>.35)b.lastSeen={...w.player.pos};
   a.aim=normalized({x:b.lastSeen!.x-a.pos.x,y:b.lastSeen!.y-a.pos.y});
   if(b.remaining<=1e-8){fire(true);b.mode='rail-recover';b.remaining=1.15;}return;
 }
 if(b.mode==='rail-recover'&&b.remaining>0)return;
 b.lastSeen={...w.player.pos};a.aim=normalized({x:w.player.pos.x-a.pos.x,y:w.player.pos.y-a.pos.y});
 if(d<=210){
   if(b.mode!=='burst'){b.mode='burst';b.shotsRemaining=6;b.remaining=0;}
   if(b.remaining<=1e-8){fire(false);b.shotsRemaining--;b.remaining=.12;if(b.shotsRemaining<=0){b.mode='rail-recover';b.remaining=.8;}}return;
 }
 if(d>390){b.mode='chase';move(w.player.pos);return;}
 b.mode='rail-charge';b.remaining=1.2;
 w.events.push({id:w.nextEventId++,time:w.time,kind:'rail-charge',pos:railMuzzlePosition(a),direction:{...a.aim},actorId:a.id,material:'metal'});
}
