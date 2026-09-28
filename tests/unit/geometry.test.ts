import {expect,test} from 'vitest';
import {segmentRectFraction,segmentCircleFraction,moveCircle} from '../../src/shared/geometry';
test('swept ray hits a thin wall',()=>expect(segmentRectFraction({x:0,y:10},{x:200,y:10},{x:100,y:0,w:4,h:20})).toBeCloseTo(.5));
test('parallel rays and zero length are handled',()=>{
  const r={x:100,y:0,w:10,h:20};
  expect(segmentRectFraction({x:0,y:10},{x:0,y:30},r)).toBeNull();
  expect(segmentRectFraction({x:105,y:10},{x:105,y:10},r)).toBe(0);
});
test('circle sweep reports first collision, including start inside',()=>{
  expect(segmentCircleFraction({x:0,y:0},{x:100,y:0},{x:50,y:0},10)).toBeCloseTo(.4);
  expect(segmentCircleFraction({x:50,y:0},{x:50,y:0},{x:50,y:0},10)).toBe(0);
});
test('body stops flush and slides along a wall',()=>{
  const p=moveCircle({x:80,y:50},{x:40,y:20},10,[{x:100,y:0,w:20,h:200}]);
  expect(p.x).toBeLessThanOrEqual(90); expect(p.y).toBeCloseTo(70);
});
