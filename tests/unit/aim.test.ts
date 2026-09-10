import {expect,test} from 'vitest';
import {aimAtPointer} from '../../src/client/input';
test('aiming at a visible torso aligns shots to its collision position',()=>{
  expect(aimAtPointer({x:100,y:100},{x:200,y:76})).toEqual({x:1,y:0});
});
