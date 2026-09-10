import type {Actor,InputFrame,World,WeaponId} from './model';
import {getBlockers} from './map';
import {segmentCircleFraction,segmentRectFraction} from './geometry';
import {WEAPONS} from './tuning';

export function applyDamage(a:Actor,damage:number):void {
  const absorbed=Math.min(a.armor,Math.max(0,damage));
  a.armor-=absorbed;a.hp=Math.max(0,a.hp-Math.max(0,damage-absorbed));
}
export function switchWeapon(a:Actor,id:WeaponId):void {
  if(a.hp<=0||a.weapon===id||!a.loadout[id])return;
  if(a.weapon!=='none')a.loadout[a.weapon]={ammo:a.ammo,reserve:a.reserve};
  a.weapon=id;a.ammo=a.loadout[id]!.ammo;a.reserve=a.loadout[id]!.reserve;a.reloadRemaining=0;
}
export function stepWeapon(a:Actor,input:InputFrame,w:World,dt:number):void {
  if(a.hp<=0||a.weapon==='none') return;
  const gun=WEAPONS[a.weapon];
  a.shotCooldown=Math.max(0,a.shotCooldown-dt);
  if(a.reloadRemaining>0) {
    a.reloadRemaining=Math.max(0,a.reloadRemaining-dt);
    if(a.reloadRemaining<1e-8) {
      a.reloadRemaining=0;
      const amount=Math.min(gun.magazine-a.ammo,a.reserve);
      a.ammo+=amount;a.reserve-=amount;
    }
  }
  if(input.reloadPressed&&a.reloadRemaining===0&&a.ammo<gun.magazine&&a.reserve>0) a.reloadRemaining=gun.reload;
  if(!input.fire||a.reloadRemaining>0||a.dashRemaining>0||a.ammo<=0||a.shotCooldown>1e-8) return;
  a.ammo--;a.shotCooldown=gun.interval;
  const base=Math.atan2(a.aim.y,a.aim.x);
  for(let i=0;i<gun.pellets;i++){
    const angle=base+(gun.pellets===1?0:(i/(gun.pellets-1)-.5)*gun.spread);
    w.projectiles.push({id:w.nextProjectileId++,ownerId:a.id,pos:{...a.pos},velocity:{x:Math.cos(angle)*gun.speed,y:Math.sin(angle)*gun.speed},damage:gun.damage,remaining:gun.lifetime});
  }
  w.noises.push({pos:{...a.pos},remaining:.25,sourceId:a.id});
}
export function stepProjectiles(w:World,dt:number):void {
  const walls=getBlockers(w.map).filter(b=>b.shots);
  w.projectiles=w.projectiles.filter(p=>{
    const travel=Math.min(dt,p.remaining);
    const end={x:p.pos.x+p.velocity.x*travel,y:p.pos.y+p.velocity.y*travel};
    let first=Infinity;let victim:Actor|null=null;
    for(const b of walls) {const hit=segmentRectFraction(p.pos,end,b);if(hit!==null&&hit<first) first=hit;}
    for(const a of [w.player,...w.enemies.map(e=>e.actor)]) {
      if(a.id===p.ownerId||a.hp<=0||(p.ownerId!=='player'&&a.kind!=='player')) continue;
      const hit=segmentCircleFraction(p.pos,end,a.pos,a.radius);
      if(hit!==null&&hit<first-1e-8) {first=hit;victim=a;}
    }
    if(first!==Infinity) {if(victim) applyDamage(victim,p.damage);return false;}
    p.pos=end;p.remaining-=dt;return p.remaining>0;
  });
}
