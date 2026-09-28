import type {Actor,Vec2} from './model';
import {normalized} from './geometry';
import {T} from './tuning';
export function weaponBearing(aim:Vec2):number{return Math.round((Math.atan2(-aim.y,Math.abs(aim.x))+Math.PI/2)/(Math.PI/4));}
// Screen-space barrel tips in the full armed sprites: S, SE, E, NE, N.
export function muzzleOffset(a:Pick<Actor,'kind'|'weapon'|'aim'>):Vec2{
  const tips=a.weapon==='railgun'?[[0,-25],[16,-24],[19,-34],[18,-41],[0,-47]]:a.kind==='spider'?[[0,-20],[18,-23],[51,-38],[32,-55],[0,-64]]:a.kind==='robot'?[[0,-16],[13,-20],[21,-25],[20,-30],[8,-30]]:a.weapon==='pistol'?[[0,-28],[6,-28],[21,-36],[17,-39],[2,-34]]:[[0,-27],[14,-26],[26,-34],[24,-39],[4,-35]];
  const tip=tips[weaponBearing(a.aim)];return {x:tip[0]*(a.aim.x<0?-1:1),y:tip[1]};
}
export function muzzlePosition(a:Pick<Actor,'kind'|'weapon'|'aim'|'pos'>):Vec2{
  const offset=muzzleOffset(a);return {x:a.pos.x+offset.x,y:a.pos.y+offset.y+T.visualAimHeight};
}
export function aimFromMuzzle(a:Pick<Actor,'kind'|'weapon'|'aim'|'pos'>,target:Vec2):Vec2{
  const muzzle=muzzlePosition(a);return normalized({x:target.x-muzzle.x,y:target.y-muzzle.y});
}

export function railMuzzlePosition(a:Pick<Actor,'aim'|'pos'>):Vec2{
  const tip=[[0,-51],[25,-57],[55,-73],[32,-80],[0,-83]][weaponBearing(a.aim)];
  return {x:a.pos.x+tip[0]*(a.aim.x<0?-1:1),y:a.pos.y+tip[1]+T.visualAimHeight};
}
