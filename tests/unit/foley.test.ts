import {expect,test} from 'vitest';
import {FoleyQueue} from '../../src/client/FoleyQueue';
import {createWorld} from '../../src/shared/simulation';
test('footsteps follow movement, stay quiet at rest, and reset without a phantom step',()=>{
  const w=createWorld(),q=new FoleyQueue();expect(q.take(w)).toEqual([]);
  w.player.pos.x+=50;w.time+=.25;expect(q.take(w).map(c=>c.weapon)).toEqual(['step-concrete']);
  w.time+=1;expect(q.take(w)).toEqual([]);q.reset();expect(q.take(w)).toEqual([]);
  w.player.pos.y=1000;w.time+=1;q.take(w);w.player.pos.x+=50;w.time+=.25;
  expect(q.take(w).map(c=>c.weapon)).toEqual(['step-grass']);
});
test('reload, equip, grenade throw and door sounds trigger only on transitions',()=>{
  const w=createWorld(),q=new FoleyQueue();q.take(w);
  w.player.reloadRemaining=1;w.time+=.033;expect(q.take(w).map(c=>c.weapon)).toEqual(['reload-pistol']);
  w.player.reloadRemaining=.8;expect(q.take(w)).toEqual([]);
  w.player.weapon='ar';w.player.reloadRemaining=0;w.grenadeCount--;
  const door=w.map.doors[0];door.open=!door.open;
  expect(q.take(w).map(c=>c.weapon)).toEqual(['equip','grenade-throw','door']);
});
