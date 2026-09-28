import {test,expect} from 'vitest';
import {createWorld} from '../../src/shared/simulation';
import {stepWeapon,stepProjectiles,switchWeapon} from '../../src/shared/combat';
import {LocalSession} from '../../src/client/LocalSession';
import {input} from './fixtures';

test('slot four has two shots total and switching or reload cannot refill it',()=>{
 const w=createWorld();switchWeapon(w.player,'railgun');expect(w.player.weapon).toBe('railgun');expect(w.player.ammo).toBe(2);expect(w.player.reserve).toBe(0);
 stepWeapon(w.player,input({fire:true}),w,1/30);expect(w.player.ammo).toBe(1);
 switchWeapon(w.player,'pistol');switchWeapon(w.player,'railgun');expect(w.player.ammo).toBe(1);
 stepWeapon(w.player,input({fire:true}),w,2);expect(w.player.ammo).toBe(0);
 stepWeapon(w.player,input({fire:true,reloadPressed:true}),w,3);expect(w.player.ammo).toBe(0);expect(w.player.reloadRemaining).toBe(0);
 expect(w.events.filter(e=>e.kind==='shot')).toHaveLength(2);
});
test('railgun produces a powerful rail shot and respects solid cover',()=>{
 const w=createWorld();w.map.blockers=[];w.map.doors=[];w.player.pos={x:100,y:500};w.player.aim={x:1,y:0};w.player.aimTarget={x:300,y:500};w.robot.pos={x:300,y:500};switchWeapon(w.player,'railgun');
 stepWeapon(w.player,input({fire:true}),w,1/30);expect(w.events[0].attack).toBe('rail');expect(w.projectiles[0].rail).toBe(true);
 stepProjectiles(w,.2);expect(w.robot.hp).toBe(0);
 w.robot.hp=100;w.player.shotCooldown=0;w.map.blockers=[{id:'wall',x:220,y:450,w:20,h:100,movement:true,sight:true,shots:true}];
 stepWeapon(w.player,input({fire:true}),w,1/30);stepProjectiles(w,.2);expect(w.robot.hp).toBe(100);
});
test('railgun cooldown prevents rapid fire and restart supplies two fresh shots',()=>{
 const s=new LocalSession();s.start();switchWeapon(s.world.player,'railgun');stepWeapon(s.world.player,input({fire:true}),s.world,1/30);stepWeapon(s.world.player,input({fire:true}),s.world,.1);expect(s.world.player.ammo).toBe(1);
 s.start();switchWeapon(s.world.player,'railgun');expect(s.world.player.ammo).toBe(2);expect(s.world.player.reserve).toBe(0);
});
