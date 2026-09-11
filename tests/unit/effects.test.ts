import {expect,test} from 'vitest';
import {createWorld,stepWorld} from '../../src/shared/simulation';
import {stepWeapon,stepProjectiles} from '../../src/shared/combat';
import {input} from './fixtures';
import {stepGrenades} from '../../src/shared/grenades';

test('organic projectile and grenade hits identify the damaged actor for blood and audio',()=>{
  const w=createWorld();w.map.blockers=[];w.map.doors=[];
  const enemy=w.enemies.find(e=>e.actor.kind==='zombie')!.actor;enemy.pos={x:150,y:100};w.robot.pos={x:900,y:900};
  w.projectiles=[{id:1,ownerId:'player',pos:{x:50,y:100},velocity:{x:6000,y:0},damage:25,remaining:1}];
  stepProjectiles(w,1/30);expect(w.events[0]).toMatchObject({kind:'impact',targetId:enemy.id,material:'flesh'});
  w.events=[];w.grenades=[{id:0,pos:{x:160,y:100},start:{x:160,y:100},target:{x:160,y:100},age:1.39}];stepGrenades(w,.02);
  expect(w.events.find(e=>e.kind==='impact'&&e.targetId===enemy.id)?.material).toBe('flesh');
});

test('a shot emits one cosmetic event without changing weapon damage or ammo',()=>{
  const w=createWorld();stepWeapon(w.player,input({fire:true}),w,1/30);
  expect(w.events.filter(e=>e.kind==='shot')).toHaveLength(1);
  expect(w.player.ammo).toBe(11);expect(w.projectiles[0].damage).toBe(25);
});
test('impact effects originate at the intercepted wall, not beyond it',()=>{
  const w=createWorld();w.map.doors=[];w.map.blockers=[{id:'wall',x:100,y:0,w:4,h:200,movement:true,sight:true,shots:true}];
  w.projectiles=[{id:1,ownerId:'player',pos:{x:50,y:100},velocity:{x:6000,y:0},damage:25,remaining:1}];
  stepProjectiles(w,1/30);const hit=w.events.find(e=>e.kind==='impact');
  expect(hit?.pos).toEqual({x:100,y:100});expect(hit?.material).toBe('concrete');
});
test('robot destruction emits metal impact and death events; old events expire',()=>{
  const w=createWorld();w.map.blockers=[];w.map.doors=[];w.robot.pos={x:150,y:100};
  w.projectiles=[{id:1,ownerId:'player',pos:{x:50,y:100},velocity:{x:6000,y:0},damage:125,remaining:1}];
  stepProjectiles(w,1/30);expect(w.events.map(e=>e.kind)).toEqual(['impact','death']);expect(w.events[0].material).toBe('metal');
  for(const e of w.enemies)e.actor.hp=0;for(let i=0;i<60;i++)stepWorld(w,input(),1/30);
  expect(w.events).toHaveLength(0);
});
