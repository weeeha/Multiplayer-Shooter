import {expect,test} from 'vitest';
import {createWorld} from '../../src/shared/simulation';
import {stepWeapon,stepProjectiles} from '../../src/shared/combat';
import {input} from './fixtures';
test('a wall intercepts a fast bullet before an actor',()=>{
  const w=createWorld();w.map.doors=[];w.map.blockers=[{id:'wall',x:100,y:0,w:4,h:200,movement:true,sight:true,shots:true}];
  w.robot.pos={x:150,y:100};
  w.projectiles=[{id:1,ownerId:'player',pos:{x:50,y:100},velocity:{x:6000,y:0},damage:25,remaining:1}];
  stepProjectiles(w,1/30);expect(w.robot.hp).toBe(100);expect(w.projectiles).toHaveLength(0);
});
test('an unobstructed hit damages once and removes projectile',()=>{
  const w=createWorld();w.map.doors=[];w.map.blockers=[];w.robot.pos={x:150,y:100};
  w.projectiles=[{id:1,ownerId:'player',pos:{x:50,y:100},velocity:{x:6000,y:0},damage:125,remaining:1}];
  stepProjectiles(w,1/30);expect(w.robot.hp).toBe(0);expect(w.projectiles).toHaveLength(0);
});
test('holding fire obeys cadence and consumes ammunition',()=>{
  const w=createWorld();for(let i=0;i<30;i++) stepWeapon(w.player,input({fire:true}),w,1/30);
  expect(w.projectiles).toHaveLength(4);expect(w.player.ammo).toBe(8);
});
test('reload consumes only available reserve on completion',()=>{
  const w=createWorld();w.player.ammo=3;w.player.reserve=2;
  stepWeapon(w.player,input({reloadPressed:true,fire:true}),w,1/30);
  expect(w.player.ammo).toBe(3);expect(w.projectiles).toHaveLength(0);
  for(let i=0;i<37;i++) stepWeapon(w.player,input(),w,1/30);
  expect(w.player.ammo).toBe(5);expect(w.player.reserve).toBe(0);
});
test('cannot fire while dashing, empty, or dead',()=>{
  const w=createWorld();w.player.dashRemaining=.1;stepWeapon(w.player,input({fire:true}),w,1/30);
  w.player.dashRemaining=0;w.player.ammo=0;stepWeapon(w.player,input({fire:true}),w,1/30);
  w.player.ammo=12;w.player.hp=0;stepWeapon(w.player,input({fire:true}),w,1/30);
  expect(w.projectiles).toHaveLength(0);
});
