import {it,expect} from 'vitest';
import {Gait} from '../../src/client/Gait';
it('cycles through four steps by distance and returns to idle when movement stops',()=>{
 const g=new Gait();expect(g.update({x:0,y:0},0,{x:1,y:0})).toBe(-1);
 const frames=new Set();for(let i=1;i<=12;i++)frames.add(g.update({x:i*8,y:0},i/30,{x:1,y:0}));expect([...frames].sort()).toEqual([0,1,2,3]);
 expect(g.update({x:96,y:0},1,{x:1,y:0})).toBe(-1);g.reset();expect(g.update({x:900,y:500},2,{x:1,y:0})).toBe(-1);
});
it('does not walk during a teleport or when only the aim changes',()=>{
 const g=new Gait();g.update({x:0,y:0},0,{x:1,y:0});expect(g.update({x:0,y:0},.1,{x:0,y:1})).toBe(-1);expect(g.update({x:1000,y:0},.2,{x:1,y:0})).toBe(-1);
});
