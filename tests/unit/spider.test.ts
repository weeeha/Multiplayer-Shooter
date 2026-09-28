import {test,expect} from 'vitest';
import {createWorld,stepWorld} from '../../src/shared/simulation';
import {input} from './fixtures';
function setup(distance=300){
 const w=createWorld();w.map.blockers=[];w.map.doors=[];w.player.pos={x:200,y:500};
 for(const e of w.enemies)e.actor.hp=0;
 const spider=w.enemies.find(e=>e.actor.kind==='spider')!;spider.actor.hp=320;spider.actor.pos={x:200+distance,y:500};
 return {w,spider};
}
const advance=(w:ReturnType<typeof createWorld>,n:number)=>{for(let i=0;i<n;i++)stepWorld(w,input(),1/30);};
test('spider telegraphs, locks its railgun aim, then fires; moving after lock dodges it',()=>{
 const {w,spider}=setup();advance(w,1);expect(spider.brain.mode).toBe('rail-charge');expect(w.projectiles).toHaveLength(0);
 advance(w,28);const lock={...spider.brain.lastSeen!};w.player.pos.y+=70;advance(w,5);
 expect(spider.brain.lastSeen).toEqual(lock);expect(w.projectiles).toHaveLength(0);
 advance(w,12);expect(w.player.armor).toBe(50);expect(w.events.some(e=>e.kind==='shot'&&e.attack==='rail')).toBe(true);
});
test('spider uses machine guns at close range and stops all attacks when dead',()=>{
 const {w,spider}=setup(150);advance(w,20);expect(w.player.armor).toBeLessThan(50);
 expect(w.events.some(e=>e.kind==='shot'&&e.weapon==='ar'&&e.attack!=='rail')).toBe(true);
 spider.actor.hp=0;w.events=[];w.projectiles=[];advance(w,30);expect(w.events).toHaveLength(0);expect(spider.brain.mode).toBe('dead');
});
test('cover interrupts a charged railgun',()=>{
 const {w,spider}=setup();advance(w,20);w.map.blockers=[{id:'wall',x:340,y:400,w:20,h:200,movement:true,sight:true,shots:true}];advance(w,25);
 expect(spider.brain.mode).not.toBe('rail-charge');expect(w.player.armor).toBe(50);expect(w.events.some(e=>e.kind==='shot')).toBe(false);
});
