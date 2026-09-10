import {describe,it,expect} from 'vitest';
import {createWorld} from '../../src/shared/simulation';
import {throwGrenade,stepGrenades} from '../../src/shared/grenades';
import {LocalSession} from '../../src/client/LocalSession';
const empty={move:{x:0,y:0},aim:{x:1,y:0},fire:false,reloadPressed:false,interactPressed:false,dashPressed:false};
describe('grenades',()=>{
 it('consumes one grenade on a press, caps range, and preserves short-frame input',()=>{
  const s=new LocalSession();s.start();s.advance(5,{...empty,grenadePressed:true,grenadeTarget:{x:1500,y:570}});s.advance(100,empty);
  expect(s.world.grenadeCount).toBe(2);expect(s.world.grenades).toHaveLength(1);expect(s.world.grenades[0].target.x).toBeLessThanOrEqual(460);
 });
 it('detonates only after the fuse and hurts the thrower with armor absorption',()=>{
  const w=createWorld();throwGrenade(w,{...w.player.pos});stepGrenades(w,1);expect(w.player.hp).toBe(100);stepGrenades(w,.41);
  expect(w.player.armor).toBe(0);expect(w.player.hp).toBeLessThan(100);expect(w.grenades).toHaveLength(0);expect(w.events.some(e=>e.kind==='explosion')).toBe(true);
 });
 it('solid cover blocks throws and blast damage; clear nearby actors take damage',()=>{
  const w=createWorld();w.map.blockers=[{id:'wall',x:230,y:500,w:20,h:150,movement:true,sight:true,shots:true}];w.map.doors=[];
  w.enemies[0].actor.pos={x:260,y:570};throwGrenade(w,{x:300,y:570});expect(w.grenades[0].target.x).toBeLessThan(230);
  stepGrenades(w,1.5);expect(w.enemies[0].actor.hp).toBe(100);expect(w.player.armor).toBeLessThan(50);
 });
 it('cannot throw when dead or empty and restart restores supplies',()=>{
  const w=createWorld();w.grenadeCount=0;throwGrenade(w,{x:200,y:570});expect(w.grenades).toHaveLength(0);
  w.grenadeCount=3;w.player.hp=0;throwGrenade(w,{x:200,y:570});expect(w.grenades).toHaveLength(0);
  const s=new LocalSession();s.world.grenadeCount=0;s.start();expect(s.world.grenadeCount).toBe(3);
 });
});
