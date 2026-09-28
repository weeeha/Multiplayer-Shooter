import type {World,Vec2} from './model';
import {getBlockers} from './map';
import {segmentRectFraction} from './geometry';
import {applyDamage} from './combat';
export const GRENADE={range:280,flight:.6,fuse:1.4,radius:115,damage:120} as const;
export function throwGrenade(w:World,target:Vec2):void {
  if(w.player.hp<=0||w.grenadeCount<=0||!Number.isFinite(target.x+target.y))return;
  const start={...w.player.pos},dx=target.x-start.x,dy=target.y-start.y,d=Math.hypot(dx,dy),scale=Math.min(1,GRENADE.range/(d||1));
  let end={x:start.x+dx*scale,y:start.y+dy*scale},first=1;
  // A high visual arc does not let this first prototype throw through roofs or cars.
  for(const b of getBlockers(w.map).filter(b=>b.shots)){
    const hit=segmentRectFraction(start,end,{...b,x:b.x-4,y:b.y-4,w:b.w+8,h:b.h+8});
    if(hit!==null)first=Math.min(first,Math.max(0,hit-.01));
  }
  end={x:start.x+(end.x-start.x)*first,y:start.y+(end.y-start.y)*first};
  end.x=Math.max(5,Math.min(w.map.bounds.w-5,end.x));end.y=Math.max(5,Math.min(w.map.bounds.h-5,end.y));
  w.grenadeCount--;w.grenades.push({id:w.nextGrenadeId++,start,target:end,pos:{...start},age:0});
}
export function stepGrenades(w:World,dt:number):void {
  const walls=getBlockers(w.map).filter(b=>b.shots);
  w.grenades=w.grenades.filter(g=>{
    g.age+=dt;const f=Math.min(1,g.age/GRENADE.flight);g.pos={x:g.start.x+(g.target.x-g.start.x)*f,y:g.start.y+(g.target.y-g.start.y)*f};
    if(g.age<GRENADE.fuse)return true;
    w.events.push({id:w.nextEventId++,time:w.time,kind:'explosion',pos:{...g.pos},direction:{x:0,y:0},actorId:'player',material:'concrete'});
    w.noises.push({pos:{...g.pos},remaining:.7,sourceId:'player'});
    for(const a of [w.player,...w.enemies.map(e=>e.actor)]){
      const d=Math.hypot(a.pos.x-g.pos.x,a.pos.y-g.pos.y);
      if(a.hp<=0||d>=GRENADE.radius||walls.some(b=>segmentRectFraction(g.pos,a.pos,b)!==null))continue;
      const material=a.kind==='robot'||a.armor>0?'metal':'flesh';
      w.events.push({id:w.nextEventId++,time:w.time,kind:'impact',pos:{...a.pos},direction:{x:a.pos.x-g.pos.x,y:a.pos.y-g.pos.y},actorId:a.id,targetId:a.id,material});
      applyDamage(a,Math.round(GRENADE.damage*(1-d/GRENADE.radius)));
      if(a.hp<=0)w.events.push({id:w.nextEventId++,time:w.time,kind:'death',pos:{...a.pos},direction:{x:0,y:0},actorId:a.id,material:a.kind==='robot'?'metal':'flesh'});
    }
    return false;
  });
}
