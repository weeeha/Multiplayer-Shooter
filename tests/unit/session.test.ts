import {expect,test} from 'vitest';
import {LocalSession} from '../../src/client/LocalSession';
import {input} from './fixtures';
test('fixed steps are independent of frame grouping',()=>{
  const a=new LocalSession(),b=new LocalSession();a.start();b.start();
  for(let i=0;i<60;i++) a.advance(1000/60,input({move:{x:1,y:0}}));
  b.advance(1000,input({move:{x:1,y:0}}));
  expect(a.world.player.pos.x).toBeCloseTo(b.world.player.pos.x);
  expect(a.world.time).toBeCloseTo(1);
});
test('door interaction edge is consumed once during catch-up',()=>{
  const s=new LocalSession();s.start();s.world.player.pos={x:532,y:450};
  s.advance(100,input({interactPressed:true}));expect(s.world.map.doors[0].open).toBe(true);
});
test('short-frame edge input survives until the next fixed tick',()=>{
  const s=new LocalSession();s.start();s.world.player.pos={x:532,y:450};
  s.advance(5,input({interactPressed:true}));s.advance(35,input());
  expect(s.world.map.doors[0].open).toBe(true);
});
test('invalid time cannot corrupt state and restart resets a run',()=>{
  const s=new LocalSession();s.start();s.advance(NaN,input());s.advance(-10,input());
  expect(s.world.time).toBe(0);s.world.player.hp=0;s.advance(40,input());expect(s.mode).toBe('dead');
  s.start();expect(s.world.player.hp).toBe(100);expect(s.world.time).toBe(0);
});
