import type {Blocker,MapData,World,Door} from './model';
import {circleTouchesRect,closestPoint,distance,segmentRectFraction} from './geometry';

export function createTestMap():MapData {
  const blockers:Blocker[]=[];
  const wall=(id:string,x:number,y:number,w:number,h:number,movement=true,sight=true,shots=true)=>blockers.push({id,x,y,w,h,movement,sight,shots});
  wall('edge-n',-32,-32,1664,32);wall('edge-s',-32,1280,1664,32);
  wall('edge-w',-32,0,32,1280);wall('edge-e',1600,0,32,1280);
  const doors:Door[]=[];
  for(const [id,y] of [['north',120],['south',760]] as const) {
    const doorY=id==='north'?y+284:y;
    const solidY=id==='north'?y:y+284;
    wall(`${id}-back`,320,solidY,420,16);
    wall(`${id}-front-l`,320,doorY,180,16); wall(`${id}-front-r`,564,doorY,176,16);
    wall(`${id}-left-top`,320,y+16,16,102);wall(`${id}-left-bottom`,320,y+182,16,102);
    wall(`${id}-right-top`,724,y+16,16,102);wall(`${id}-right-bottom`,724,y+182,16,102);
    wall(`${id}-window`,724,y+118,16,64,true,false,false);
    doors.push({id:`${id}-door`,x:500,y:doorY,w:64,h:16,open:false});
  }
  wall('car-a',820,580,100,48);wall('car-b',620,650,100,48);
  return {bounds:{x:0,y:0,w:1600,h:1280},blockers,doors,
    buildings:[{id:'north',label:'RELAY / 01',x:320,y:120,w:420,h:300},{id:'south',label:'WORKSHOP / 02',x:320,y:760,w:420,h:300}],
    playerSpawn:{x:180,y:570},robotPatrol:[{x:1100,y:500},{x:1100,y:680},{x:980,y:680},{x:980,y:500}]};
}
export function getBlockers(map:MapData):Blocker[] {
  return [...map.blockers,...map.doors.filter(d=>!d.open).map(d=>({...d,movement:true,sight:true,shots:true}))];
}
export function nearbyDoors(world:World):Door[] {
  return world.map.doors.filter(d=>{
    const point=closestPoint(world.player.pos,d);
    return distance(world.player.pos,point)<=64&&!getBlockers(world.map).some(b=>b.id!==d.id&&b.movement&&segmentRectFraction(world.player.pos,point,b)!==null);
  }).sort((a,b)=>distance(world.player.pos,closestPoint(world.player.pos,a))-distance(world.player.pos,closestPoint(world.player.pos,b))||a.id.localeCompare(b.id));
}
export function toggleNearestDoor(world:World):boolean {
  if(world.player.hp<=0) return false;
  const door=nearbyDoors(world)[0];
  if(!door) return false;
  if(door.open&&[world.player,...world.enemies.map(e=>e.actor)].some(a=>a.hp>0&&circleTouchesRect(a.pos,a.radius,door))) return false;
  door.open=!door.open;return true;
}
