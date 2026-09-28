import {expect,test} from 'vitest';
import {createWorld,stepWorld} from '../../src/shared/simulation';
import {input} from './fixtures';

function encounter(){
  const w=createWorld();w.map.blockers=[];w.map.doors=[];w.player.pos={x:100,y:100};
  for(const e of w.enemies)e.actor.hp=0;
  const dog=w.enemies.find(e=>e.actor.kind==='dog')!;dog.actor.hp=60;dog.actor.pos={x:128,y:100};dog.brain.mode='chase';dog.brain.remaining=0;
  return {w,dog};
}
const advance=(w:ReturnType<typeof createWorld>,frames:number)=>{for(let i=0;i<frames;i++)stepWorld(w,input(),1/30);};
test('dog winds up before biting, damages armor on contact, and recovers before the next bite',()=>{
  const {w}=encounter();advance(w,1);expect(w.player.armor).toBe(50);expect(w.events.filter(e=>e.kind==='bite')).toHaveLength(1);
  advance(w,5);expect(w.player.armor).toBe(38);expect(w.player.hp).toBe(100);
  expect(w.events.some(e=>e.kind==='impact'&&e.targetId==='player')).toBe(true);
  advance(w,15);expect(w.player.armor).toBe(38);
  advance(w,15);expect(w.player.armor).toBe(26);
});
test('a lethal melee hit emits exactly one player death event',()=>{
  const {w}=encounter();w.player.armor=0;w.player.hp=12;
  advance(w,6);advance(w,5);
  expect(w.player.hp).toBe(0);
  expect(w.events.filter(e=>e.kind==='death'&&e.actorId===w.player.id)).toHaveLength(1);
});
test.each(['escape','cover','dead dog','dead player'])('pending bite cannot connect after %s',scenario=>{
  const {w,dog}=encounter();advance(w,1);expect(w.events.some(e=>e.kind==='bite')).toBe(true);
  if(scenario==='escape')w.player.pos={x:65,y:100};
  if(scenario==='cover')w.map.blockers=[{id:'wall',x:115,y:70,w:4,h:60,movement:true,sight:true,shots:true}];
  if(scenario==='dead dog')dog.actor.hp=0;
  if(scenario==='dead player')w.player.hp=0;
  advance(w,6);expect(w.player.armor).toBe(50);expect(w.events.filter(e=>e.kind==='impact')).toHaveLength(0);
});
