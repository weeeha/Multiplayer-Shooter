import {expect,test} from 'vitest';
import {createWorld} from '../../src/shared/simulation';
import {stepRobot} from '../../src/shared/robot';
test('hidden movement does not change last observed position',()=>{
  const w=createWorld();w.robot.pos={x:50,y:100};w.player.pos={x:150,y:100};w.map.doors=[];
  w.map.blockers=[{id:'wall',x:100,y:0,w:16,h:200,movement:true,sight:true,shots:true}];
  w.brain.mode='investigate';w.brain.remaining=2;w.brain.lastSeen={x:70,y:100};
  stepRobot(w,1/30);expect(w.brain.lastSeen).toEqual({x:70,y:100});
});
test('losing sight cancels telegraphed attack',()=>{
  const w=createWorld();w.robot.pos={x:50,y:100};w.player.pos={x:150,y:100};w.map.doors=[];w.map.blockers=[];
  stepRobot(w,1/30);expect(w.brain.mode).toBe('telegraph');
  w.map.blockers=[{id:'wall',x:100,y:0,w:16,h:200,movement:true,sight:true,shots:true}];
  stepRobot(w,1/30);expect(w.brain.mode).toBe('investigate');expect(w.projectiles).toHaveLength(0);
});
test('noise investigation expires and does not follow hidden player',()=>{
  const w=createWorld();w.player.pos={x:50,y:50};w.noises=[{pos:{x:1000,y:500},remaining:.1,sourceId:'player'}];
  stepRobot(w,1/30);expect(w.brain.mode).toBe('investigate');expect(w.brain.lastSeen).toEqual({x:1000,y:500});
  w.noises=[];for(let i=0;i<100;i++) stepRobot(w,1/30);
  expect(w.brain.mode).toBe('patrol');
});
test('robot fires after telegraph and never after death',()=>{
  const w=createWorld();w.map.blockers=[];w.map.doors=[];w.robot.pos={x:200,y:100};w.player.pos={x:50,y:100};
  for(let i=0;i<15;i++) stepRobot(w,1/30);expect(w.projectiles).toHaveLength(0);
  for(let i=0;i<15;i++) stepRobot(w,1/30);expect(w.projectiles.length).toBeGreaterThan(0);
  w.robot.hp=0;w.projectiles=[];stepRobot(w,1/30);expect(w.brain.mode).toBe('dead');expect(w.projectiles).toHaveLength(0);
});
