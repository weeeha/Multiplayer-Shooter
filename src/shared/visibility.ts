import type {Vec2,Blocker} from './model';
import {distance,segmentRectFraction} from './geometry';
export function canSee(from:Vec2,to:Vec2,blockers:Blocker[],radius:number):boolean {
  if(distance(from,to)>radius) return false;
  return !blockers.some(b=>b.sight&&segmentRectFraction(from,to,b)!==null);
}
export function visibilityPolygon(from:Vec2,blockers:Blocker[],radius:number):Vec2[] {
  const walls=blockers.filter(b=>b.sight&&b.x<=from.x+radius&&b.x+b.w>=from.x-radius&&b.y<=from.y+radius&&b.y+b.h>=from.y-radius);
  const angles=Array.from({length:192},(_,i)=>i*Math.PI*2/192-Math.PI);
  for(const b of walls) for(const x of [b.x,b.x+b.w]) for(const y of [b.y,b.y+b.h]) {
    const angle=Math.atan2(y-from.y,x-from.x);
    angles.push(angle-.0001,angle,angle+.0001);
  }
  angles.sort((a,b)=>a-b);
  return angles.map(a=>{
    const end={x:from.x+Math.cos(a)*radius,y:from.y+Math.sin(a)*radius};
    let fraction=1;
    for(const b of walls) {const f=segmentRectFraction(from,end,b);if(f!==null) fraction=Math.min(fraction,f);}
    return {x:from.x+(end.x-from.x)*fraction,y:from.y+(end.y-from.y)*fraction};
  });
}
