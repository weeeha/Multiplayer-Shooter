import {expect,test} from 'vitest';
import {createWorld} from '../../src/shared/simulation';
import {stepWeapon,stepProjectiles} from '../../src/shared/combat';
import {muzzlePosition,aimFromMuzzle} from '../../src/shared/muzzle';
import {input} from './fixtures';
test('bullets and shot effects originate from the same muzzle, ahead of the torso',()=>{
  const w=createWorld();w.player.pos={x:100,y:100};w.player.aim={x:1,y:0};
  stepWeapon(w.player,input({fire:true}),w,1/30);
  expect(w.projectiles[0].pos).toEqual({x:121,y:88});
  expect(w.events.find(e=>e.kind==='shot')?.pos).toEqual(w.projectiles[0].pos);
});
test('all guns and mirrored bearings aim from their muzzle through the target',()=>{
  const w=createWorld();w.player.pos={x:500,y:500};
  for(const weapon of ['pistol','ar','shotgun'] as const)for(const target of [{x:800,y:500},{x:200,y:500},{x:500,y:200},{x:500,y:800},{x:740,y:740}]){
    w.player.weapon=weapon;const distance=Math.hypot(target.x-500,target.y-500);w.player.aim={x:(target.x-500)/distance,y:(target.y-500)/distance};const direction=aimFromMuzzle(w.player,target);const muzzle=muzzlePosition(w.player);
    const dx=target.x-muzzle.x,dy=target.y-muzzle.y;
    expect(Math.abs(dx*direction.y-dy*direction.x)).toBeLessThan(.001);
    expect(Math.hypot(muzzle.x-500,muzzle.y-500)).toBeGreaterThan(0);
  }
});
test('a muzzle pressed into cover cannot spawn bullets past that cover',()=>{
  const w=createWorld();w.map.doors=[];w.player.pos={x:100,y:100};w.player.aim={x:1,y:0};
  w.map.blockers=[{id:'wall',x:115,y:60,w:5,h:80,movement:true,sight:true,shots:true}];w.robot.pos={x:150,y:100};
  stepWeapon(w.player,input({fire:true}),w,1/30);stepProjectiles(w,1/30);
  expect(w.robot.hp).toBe(100);expect(w.projectiles).toHaveLength(0);
  expect(w.events.some(e=>e.kind==='impact'&&e.pos.x<=115)).toBe(true);
});
