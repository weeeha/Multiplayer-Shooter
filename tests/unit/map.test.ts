import {expect,test} from 'vitest';
import {createTestMap,getBlockers,toggleNearestDoor} from '../../src/shared/map';
import {createWorld} from '../../src/shared/simulation';
test('closed doors block all channels and opening removes the blocker',()=>{
  const w=createWorld(); w.player.pos={x:532,y:450};
  expect(getBlockers(w.map).some(b=>b.id==='north-door')).toBe(true);
  expect(toggleNearestDoor(w)).toBe(true);
  expect(getBlockers(w.map).some(b=>b.id==='north-door')).toBe(false);
});
test('doors refuse distant or occupied interaction',()=>{
  const w=createWorld(); expect(toggleNearestDoor(w)).toBe(false);
  w.map.doors[0].open=true;w.player.pos={x:532,y:412};
  expect(toggleNearestDoor(w)).toBe(false);
});
test('maps are independent and window sills block movement only',()=>{
  const a=createTestMap(),b=createTestMap(); a.doors[0].open=true;
  expect(b.doors[0].open).toBe(false);
  const sill=a.blockers.find(b=>b.id.includes('window'))!;
  expect(sill.movement).toBe(true);expect(sill.sight).toBe(false);expect(sill.shots).toBe(false);
});
