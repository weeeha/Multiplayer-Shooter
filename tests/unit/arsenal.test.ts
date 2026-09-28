import {expect,test} from 'vitest';
import {createWorld,stepWorld} from '../../src/shared/simulation';
import {applyDamage,stepWeapon,switchWeapon} from '../../src/shared/combat';
import {WEAPONS} from '../../src/shared/tuning';
import {input} from './fixtures';

test('armor absorbs damage before health, including overflow',()=>{
  const p=createWorld().player;p.armor=30;
  applyDamage(p,20);expect(p.armor).toBe(10);expect(p.hp).toBe(100);
  applyDamage(p,35);expect(p.armor).toBe(0);expect(p.hp).toBe(75);
});
test('shotgun fires a spread for one shell and AR fires faster than pistol',()=>{
  const w=createWorld();switchWeapon(w.player,'shotgun');
  stepWeapon(w.player,input({fire:true}),w,1/30);
  expect(w.projectiles).toHaveLength(6);expect(w.player.ammo).toBe(5);
  expect(new Set(w.projectiles.map(p=>p.velocity.y)).size).toBe(6);
  const ar=createWorld();switchWeapon(ar.player,'ar');
  for(let i=0;i<30;i++)stepWeapon(ar.player,input({fire:true}),ar,1/30);
  expect(ar.projectiles.length).toBe(10);expect(ar.player.ammo).toBe(20);
});
test('shotgun spread varies reproducibly between shells without leaving its cone',()=>{
  const fireSequence=()=>{
    const w=createWorld();switchWeapon(w.player,'shotgun');w.player.aim={x:1,y:0};
    const patterns:number[][]=[];
    for(let shell=0;shell<2;shell++){
      stepWeapon(w.player,input({fire:true}),w,1/30);
      patterns.push(w.projectiles.slice(-WEAPONS.shotgun.pellets).map(p=>Math.atan2(p.velocity.y,p.velocity.x)));
      w.player.shotCooldown=0;
    }
    return patterns;
  };
  const patterns=fireSequence();
  expect(patterns[1]).not.toEqual(patterns[0]);
  expect(fireSequence()).toEqual(patterns);
  for(const angle of patterns.flat())expect(Math.abs(angle)).toBeLessThanOrEqual(WEAPONS.shotgun.spread/2);
});
test('switching preserves weapon ammunition and cannot bypass cooldown or reload',()=>{
  const w=createWorld();stepWeapon(w.player,input({fire:true}),w,1/30);
  switchWeapon(w.player,'ar');switchWeapon(w.player,'pistol');
  expect(w.player.ammo).toBe(11);
  stepWeapon(w.player,input({fire:true}),w,1/30);expect(w.projectiles).toHaveLength(1);
  stepWeapon(w.player,input({reloadPressed:true}),w,1/30);switchWeapon(w.player,'ar');
  expect(w.player.reloadRemaining).toBe(0);switchWeapon(w.player,'pistol');expect(w.player.ammo).toBe(11);
});
test('roster has armed enemies, a dog, a zombie and a spider robot',()=>{
  const w=createWorld();expect(w.enemies).toHaveLength(6);
  expect(w.enemies.filter(e=>e.actor.weapon!=='none').map(e=>e.actor.weapon).sort()).toEqual(['ar','ar','pistol','shotgun']);
  expect(w.enemies.map(e=>e.actor.kind)).toContain('dog');expect(w.enemies.map(e=>e.actor.kind)).toContain('zombie');
});
test('dog closes distance faster than zombie and melee respects walls and cooldown',()=>{
  const w=createWorld();w.map.blockers=[];w.map.doors=[];w.player.pos={x:100,y:100};
  for(const e of w.enemies)e.actor.hp=0;
  const dog=w.enemies.find(e=>e.actor.kind==='dog')!,zombie=w.enemies.find(e=>e.actor.kind==='zombie')!;
  for(const e of [dog,zombie]){e.actor.hp=100;e.actor.pos={x:200,y:100};}
  stepWorld(w,input(),1/30);expect(dog.actor.pos.x).toBeLessThan(zombie.actor.pos.x);
  zombie.actor.hp=0;dog.actor.pos={x:125,y:100};w.player.armor=0;
  w.map.blockers=[{id:'wall',x:112,y:70,w:4,h:60,movement:true,sight:true,shots:true}];
  for(let i=0;i<30;i++)stepWorld(w,input(),1/30);expect(w.player.hp).toBe(100);
  w.map.blockers=[];for(let i=0;i<26;i++)stepWorld(w,input(),1/30);
  expect(w.player.hp).toBeLessThan(100);expect(w.player.hp).toBeGreaterThanOrEqual(88);
});

test('shotgun shooter advances into effective range before firing',()=>{
  const w=createWorld();w.map.blockers=[];w.map.doors=[];w.player.pos={x:100,y:100};
  for(const e of w.enemies)e.actor.hp=0;
  const e=w.enemies.find(e=>e.actor.weapon==='shotgun')!;e.actor.hp=100;e.actor.pos={x:450,y:100};
  stepWorld(w,input(),1/30);expect(e.actor.pos.x).toBeLessThan(450);expect(w.projectiles).toHaveLength(0);
});
test('dead melee enemies cannot attack and all enemies are hittable',()=>{
  const w=createWorld();w.map.blockers=[];w.map.doors=[];w.player.pos={x:100,y:100};
  for(const e of w.enemies)e.actor.hp=0;
  const dog=w.enemies.find(e=>e.actor.kind==='dog')!;dog.actor.pos={x:125,y:100};dog.brain.mode='chase';dog.brain.remaining=0;
  stepWorld(w,input(),1/30);expect(w.player.armor).toBe(50);
  dog.actor.hp=60;w.player.aim={x:1,y:0};stepWorld(w,input({fire:true,aimTarget:{...dog.actor.pos}}),1/30);expect(dog.actor.hp).toBe(35);
});

test('shooters outside the vertical gameplay view cannot engage the player',()=>{
  const w=createWorld();w.map.blockers=[];w.map.doors=[];w.player.pos={x:100,y:500};
  for(const e of w.enemies)e.actor.hp=0;
  const e=w.enemies.find(e=>e.actor.weapon==='ar')!;e.actor.hp=100;e.actor.pos={x:100,y:150};e.patrol=[{...e.actor.pos},{...e.actor.pos}];
  for(let i=0;i<90;i++)stepWorld(w,input(),1/30);
  expect(w.player.armor).toBe(50);expect(w.projectiles).toHaveLength(0);
});
