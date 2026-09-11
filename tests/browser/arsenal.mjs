import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='output/arsenal-verification';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
await page.addInitScript(()=>{window.hitAudio=[];const original=AudioContext.prototype.createBufferSource;AudioContext.prototype.createBufferSource=function(){const source=original.call(this),start=source.start.bind(source);source.start=(...args)=>{if(source.buffer&&[.18,.26].some(d=>Math.abs(source.buffer.duration-d)<.001))window.hitAudio.push(source.buffer.duration);return start(...args);};return source;};});
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const walking=new Set();
const state=async()=>{const s=await page.evaluate(()=>JSON.parse(window.render_game_to_text()));for(const a of s.visuals.actors??[])if(a.visible&&a.walking)walking.add(a.texture.replace(/^walk-/, '').replace(/-\d-\d$/, ''));return s;};
const advance=ms=>page.evaluate(ms=>window.advanceTime(ms),ms);
const tap=async key=>{await page.keyboard.press(key);await advance(34);};
const aim=async(x,y)=>{const s=await state(),b=await page.locator('canvas').boundingBox();const sx=Math.max(0,Math.min(640,s.player.x-480)),sy=Math.max(0,Math.min(740,s.player.y-270));await page.mouse.move(b.x+(x-sx)*b.width/960,b.y+(y-24-sy)*b.height/540);};
const shot=async name=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:`${dir}/${name}.png`});await writeFile(`${dir}/${name}.json`,JSON.stringify(await state(),null,2));};
const restart=async()=>{await page.goto('http://127.0.0.1:5173/?test=1');await page.locator('#start-btn').click();await advance(34);};
const seen=new Set(),dead=new Set();let bloodCaptured=false;
const engage=async()=>{
 const s=await state();assert.notEqual(s.mode,'dead','survives exploration');
 if(s.visuals.bloodParticles>0&&!bloodCaptured){bloodCaptured=true;await shot('organic-hit');}
 const enemies=s.visibleEnemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-s.player.x,a.y-s.player.y)-Math.hypot(b.x-s.player.x,b.y-s.player.y));
 for(const e of s.visibleEnemies){const sx=Math.max(0,Math.min(640,s.player.x-480)),sy=Math.max(0,Math.min(740,s.player.y-270));const inFrame=e.x>=sx+20&&e.x<=sx+940&&e.y>=sy+65&&e.y<=sy+520;if(inFrame&&!seen.has(e.id)){seen.add(e.id);await aim(e.x,e.y);await shot(`enemy-${e.id}`);}if(e.hp===0)dead.add(e.id);}
 if(enemies.length){await aim(enemies[0].x,enemies[0].y);await page.mouse.down();}else await page.mouse.up();
 if(s.player.ammo===0&&s.player.reloadRemaining===0)await tap('KeyR');
};
const walk=async(key,ms)=>{await page.keyboard.down(key);for(let t=0;t<ms;t+=100){await engage();await advance(Math.min(100,ms-t));}await page.keyboard.up(key);};
try{
 await restart();assert.equal((await state()).player.armor,50);
 await aim(500,570);await advance(34);assert.equal(await page.locator('.crosshair').isVisible(),true);
 await shot('hud-pistol');
 await tap('Digit2');assert.equal((await state()).player.weapon,'ar');assert.equal((await state()).player.ammo,30);
 await page.mouse.down();await advance(350);await page.mouse.up();assert.equal((await state()).player.ammo,26);await shot('hud-ar');
 await tap('Digit3');assert.equal((await state()).player.weapon,'shotgun');await page.mouse.down();await advance(300);await page.mouse.up();
 assert.equal((await state()).player.ammo,5);await shot('hud-shotgun');
 await page.getByRole('button',{name:'Equip assault rifle'}).click();await advance(34);assert.equal((await state()).player.ammo,26);
 await tap('KeyR');await advance(1700);assert.equal((await state()).player.ammo,30);assert.equal((await state()).player.reserve,116);
 await page.setViewportSize({width:1060,height:800});await aim(500,570);await advance(34);await shot('hud-resized');
 for(const selector of ['.health','.armor','.ammo','.weapon-rack']){const box=await page.locator(selector).boundingBox();assert.ok(box.y>=0&&box.y+box.height<=800,`${selector} stays inside viewport`);}
 await page.setViewportSize({width:1280,height:720});
 await restart();await tap('Digit2');
 await walk('KeyS',2450);await walk('KeyD',3500);
 for(let i=0;i<20;i++){await engage();await advance(100);}await page.mouse.up();await shot('south-encounter');
 await walk('KeyD',1200);await walk('KeyW',1300);
 for(let i=0;i<40;i++){await engage();await advance(100);}await page.mouse.up();await shot('east-encounter');
 await restart();await tap('Digit2');await walk('KeyW',2300);await walk('KeyD',5200);await walk('KeyS',650);
 for(let i=0;i<20;i++){await engage();await advance(100);}await page.mouse.up();await shot('north-encounter');
 assert.ok(seen.has('dog'));assert.ok(seen.has('zombie'));assert.ok(seen.has('scav-shotgun'));assert.ok(seen.has('scav-ar'));
 assert.ok(dead.has('dog'));assert.ok(dead.has('zombie'));assert.ok(dead.has('scav-shotgun'));assert.ok(dead.has('scav-ar'));
 for(const id of ['robot','scav-ar','scav-shotgun','dog','zombie'])assert.ok(walking.has(id),`${id} walks in the encounter`);
 assert.ok(bloodCaptured,'organic hits produce visible blood');
 const hitSounds=await page.evaluate(()=>window.hitAudio);assert.ok(hitSounds.length>0,'hit sounds reach browser audio');
 assert.deepEqual(errors,[]);
 const report={status:'passed',checks:['Crosshair visible','Health and armor HUD','Keyboard and clickable weapon slots','Weapon-specific firing and reload','Ammo preserved on switch','HUD resize','All new enemies encountered and defeated through normal movement'],bloodCaptured,hitSounds,walking:[...walking],seen:[...seen],dead:[...dead],errors};
 await writeFile(`${dir}/report.json`,JSON.stringify(report,null,2));console.log(report);
}catch(e){await shot('failure');console.error(e,await state());process.exitCode=1;}finally{await browser.close();}
