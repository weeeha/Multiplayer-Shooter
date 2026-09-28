import { expect, test } from 'vitest';
import { stepMovement } from '../../src/shared/movement';
import { actor, input } from './fixtures';
test('diagonal movement does not increase speed', () => {
  const a=actor(), b=actor();
  stepMovement(a,input({move:{x:1,y:0}}),[],false,1/30);
  stepMovement(b,input({move:{x:1,y:1}}),[],false,1/30);
  expect(Math.hypot(b.pos.x,b.pos.y)).toBeCloseTo(a.pos.x);
  expect(a.pos.x).toBeCloseTo(220/30);
});
test('aim is independent and zero direction preserves previous aim', () => {
  const a=actor(); stepMovement(a,input({move:{x:1,y:0},aim:{x:0,y:-1}}),[],false,1/30);
  expect(a.aim).toEqual({x:0,y:-1});
  stepMovement(a,input({aim:{x:0,y:0}}),[],false,1/30); expect(a.aim).toEqual({x:0,y:-1});
});
test('dash respects cover and cannot be repeated through cooldown', () => {
  const a=actor(); a.pos={x:80,y:50};
  const wall=[{x:110,y:0,w:16,h:200}];
  stepMovement(a,input({move:{x:1,y:0},dashPressed:true}),wall,true,1/30);
  expect(a.dashRemaining).toBeGreaterThan(0);
  for(let i=0;i<10;i++) stepMovement(a,input({move:{x:1,y:0},dashPressed:true}),wall,true,1/30);
  expect(a.pos.x).toBeLessThanOrEqual(98); expect(a.dashCooldown).toBeGreaterThan(0);
});
test('disabled dash and dead actors do not dash', () => {
  const a=actor(); stepMovement(a,input({move:{x:1,y:0},dashPressed:true}),[],false,1/30);
  expect(a.dashRemaining).toBe(0); a.hp=0; const x=a.pos.x;
  stepMovement(a,input({move:{x:1,y:0}}),[],true,1/30); expect(a.pos.x).toBe(x);
});
