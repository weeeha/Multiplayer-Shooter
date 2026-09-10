import type {LocalSession} from './LocalSession';
import {getBlockers,nearbyDoors} from '../shared/map';
import {canSee} from '../shared/visibility';
import {T} from '../shared/tuning';
declare global {interface Window {render_game_to_text?:()=>string;advanceTime?:(ms:number)=>void}}
export function installTestHooks(session:LocalSession,advance:(ms:number)=>void):()=>void {
  window.advanceTime=advance;
  window.render_game_to_text=()=>{
    const w=session.world,blockers=getBlockers(w.map),p=w.player;
    const visible=canSee(p.pos,w.robot.pos,blockers,T.sight);
    return JSON.stringify({mode:session.mode,coordinates:'world units; origin top-left; +x right; +y down',time:w.time,
      player:{x:p.pos.x,y:p.pos.y,hp:p.hp,armor:p.armor,weapon:p.weapon,ammo:p.ammo,reserve:p.reserve,aim:p.aim,reloadRemaining:p.reloadRemaining,dashCooldown:p.dashCooldown},
      hostilesRemaining:w.enemies.filter(e=>e.actor.hp>0).length,
      visibleEnemies:w.enemies.filter(e=>canSee(p.pos,e.actor.pos,blockers,T.sight)).map(e=>({id:e.actor.id,kind:e.actor.kind,weapon:e.actor.weapon,x:e.actor.pos.x,y:e.actor.pos.y,hp:e.actor.hp,state:e.brain.mode})),
      visibleRobot:visible?{x:w.robot.pos.x,y:w.robot.pos.y,hp:w.robot.hp,state:w.brain.mode}:null,
      visibleProjectiles:w.projectiles.filter(b=>canSee(p.pos,b.pos,blockers,T.sight)).map(b=>({x:b.pos.x,y:b.pos.y})),
      nearbyDoors:nearbyDoors(w).map(d=>({id:d.id,open:d.open})),dashEnabled:w.dashEnabled});
  };
  return ()=>{delete window.advanceTime;delete window.render_game_to_text;};
}
