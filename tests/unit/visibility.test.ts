import {expect,test} from 'vitest';
import {canSee,visibilityPolygon} from '../../src/shared/visibility';
import type {Blocker} from '../../src/shared/model';
const wall:Blocker={id:'wall',x:100,y:0,w:16,h:200,movement:true,sight:true,shots:true};
test('walls hide nearby actors',()=>expect(canSee({x:50,y:100},{x:150,y:100},[wall],420)).toBe(false));
test('doorway reveals only its opening',()=>{
  const sides=[{...wall,h:70},{...wall,id:'lower',y:130,h:70}];
  expect(canSee({x:50,y:100},{x:150,y:100},sides,420)).toBe(true);
  expect(canSee({x:50,y:30},{x:150,y:30},sides,420)).toBe(false);
});
test('radius bounds sight while movement-only sills do not',()=>{
  expect(canSee({x:0,y:0},{x:421,y:0},[],420)).toBe(false);
  expect(canSee({x:50,y:100},{x:150,y:100},[{...wall,sight:false}],420)).toBe(true);
});
test('visibility polygon is finite and clipped at cover',()=>{
  const polygon=visibilityPolygon({x:50,y:100},[wall],420);
  expect(polygon.length).toBeGreaterThanOrEqual(192);
  expect(polygon.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.hypot(p.x-50,p.y-100)<=420.0001)).toBe(true);
  expect(polygon.some(p=>Math.abs(p.y-100)<.01&&Math.abs(p.x-100)<.01)).toBe(true);
});
