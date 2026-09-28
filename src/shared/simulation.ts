import type {Actor,World,InputFrame,Enemy,RobotBrain} from './model';
import {createTestMap,getBlockers,toggleNearestDoor} from './map';
import {T,WEAPONS} from './tuning';
import {stepMovement} from './movement';
import {stepWeapon,stepProjectiles,switchWeapon} from './combat';
import {throwGrenade,stepGrenades} from './grenades';
import {stepEnemy} from './robot';
export function createWorld():World {
  const map=createTestMap();
  const make=(id:string,kind:Actor['kind'],pos:Actor['pos'],weapon:Actor['weapon']='pistol'):Actor=>({
    id,kind,pos:{...pos},weapon,armor:kind==='player'?50:kind==='spider'?60:0,maxHp:kind==='spider'?320:kind==='dog'?60:100,radius:kind==='spider'?28:kind==='dog'?10:T.radius,hp:kind==='spider'?320:kind==='dog'?60:100,aim:{x:1,y:0},
    loadout:kind==='player'?Object.fromEntries(Object.entries(WEAPONS).map(([id,g])=>[id,{ammo:g.magazine,reserve:g.reserve}])):{},
    ammo:weapon==='none'?0:WEAPONS[weapon].magazine,reserve:weapon==='none'?0:WEAPONS[weapon].reserve,reloadRemaining:0,shotCooldown:0,dashRemaining:0,dashCooldown:0,dashDirection:{x:0,y:0}});
  const brain=():RobotBrain=>({mode:'patrol',remaining:0,waypoint:1,lastSeen:null,shotsRemaining:0});
  const enemies:Enemy[]=[
    {actor:make('robot','robot',map.robotPatrol[0]),brain:brain(),patrol:map.robotPatrol},
    {actor:make('scav-ar','scavenger',{x:1370,y:270},'ar'),brain:brain(),patrol:[{x:1370,y:270},{x:1370,y:390}]},
    {actor:make('scav-shotgun','scavenger',{x:1280,y:1040},'shotgun'),brain:brain(),patrol:[{x:1280,y:1040},{x:1420,y:1040}]},
    {actor:make('dog','dog',{x:940,y:1060},'none'),brain:brain(),patrol:[{x:940,y:1060},{x:1040,y:1060}]},
    {actor:make('zombie','zombie',{x:1400,y:730},'none'),brain:brain(),patrol:[{x:1400,y:730},{x:1400,y:850}]},
    {actor:make('spider','spider',{x:1480,y:1160},'ar'),brain:brain(),patrol:[{x:1480,y:1160},{x:1390,y:1190}]},
  ];
  return {grenades:[],grenadeCount:3,nextGrenadeId:0,events:[],nextEventId:0,time:0,map,player:make('player','player',map.playerSpawn),robot:enemies[0].actor,brain:enemies[0].brain,enemies,
    projectiles:[],noises:[],nextProjectileId:0,dashEnabled:true};
}
export function stepWorld(w:World,input:InputFrame,dt:number):void {
  if(!Number.isFinite(dt)||dt<=0) return;
  const playerWasAlive=w.player.hp>0,eventStart=w.nextEventId;
  if(input.interactPressed) toggleNearestDoor(w);
  stepMovement(w.player,input,getBlockers(w.map).filter(b=>b.movement),w.dashEnabled,dt);
  if(input.weaponPressed)switchWeapon(w.player,input.weaponPressed);
  if(input.grenadePressed)throwGrenade(w,input.grenadeTarget??{x:w.player.pos.x+input.aim.x*240,y:w.player.pos.y+input.aim.y*240});
  stepWeapon(w.player,input,w,dt);
  for(const enemy of w.enemies)stepEnemy(w,enemy,dt);
  stepProjectiles(w,dt);
  stepGrenades(w,dt);
  if(playerWasAlive&&w.player.hp<=0&&!w.events.some(e=>e.id>=eventStart&&e.kind==='death'&&e.actorId===w.player.id))
    w.events.push({id:w.nextEventId++,time:w.time,kind:'death',pos:{...w.player.pos},direction:{x:0,y:0},actorId:w.player.id,material:'flesh'});
  for(const e of w.enemies)if(e.actor.hp<=0)e.brain.mode='dead';
  w.noises=w.noises.filter(n=>(n.remaining-=dt)>0);
  w.time+=dt;
  w.events=w.events.filter(e=>w.time-e.time<.8).slice(-256);
}
