import {captureAudio,waitForAudio} from './audio-capture.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='output/spider-verification';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
await captureAudio(page);
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const walking=new Set();
const state=async()=>{const s=await page.evaluate(()=>JSON.parse(window.render_game_to_text()));for(const a of s.visuals.actors??[])if(a.visible&&a.walking)walking.add(a.texture.replace(/^walk-/, '').replace(/-\d-\d$/, ''));return s;};
const advance=ms=>page.evaluate(ms=>window.advanceTime(ms),ms);
const tap=async key=>{await page.keyboard.press(key);await advance(34);};
const aim=async(x,y)=>{const s=await state(),b=await page.locator('canvas').boundingBox();const sx=Math.max(0,Math.min(640,s.player.x-480)),sy=Math.max(0,Math.min(740,s.player.y-270));await page.mouse.move(b.x+(x-sx)*b.width/960,b.y+(y-24-sy)*b.height/540);};
const shot=async name=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:`${dir}/${name}.png`});await writeFile(`${dir}/${name}.json`,JSON.stringify(await state(),null,2));};
const deathSounds=new Set();
const collectDeaths=async()=>{for(const duration of await page.evaluate(()=>(window.audioEvents??[]).filter(e=>e.file.includes('-death-')).map(e=>e.file.split('/').pop().replace(/-\d+\.wav$/, ''))))deathSounds.add(duration);};
const restart=async()=>{await collectDeaths();await page.goto('http://127.0.0.1:5173/?test=1');await page.locator('#start-btn').click();await waitForAudio(page);await advance(34);};
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
 await restart();await tap('Digit2');await walk('KeyS',2450);await walk('KeyD',4200);await page.mouse.up();
 let spider=(await state()).visibleEnemies.find(e=>e.id==='spider');assert.ok(spider,'spider encountered in southeast');
 await shot('01-spider');
 // Stay at range until the railgun locks, then sidestep with ordinary movement.
 for(let i=0;i<60;i++){spider=(await state()).visibleEnemies.find(e=>e.id==='spider');if(spider?.state==='rail-charge'&&spider.chargeRemaining<=.3)break;await advance(34);}
 assert.equal(spider.state,'rail-charge');await shot('02-locked');const before=(await state()).player;
 await page.keyboard.down('KeyS');for(let i=0;i<15;i++)await advance(34);await page.keyboard.up('KeyS');await shot('03-dodged');
 assert.equal((await state()).player.hp,before.hp);assert.equal((await state()).player.armor,before.armor);
 // Close the gap and survive one burst, then destroy the machine.
 await walk('KeyD',600);await page.mouse.up();await shot('04-close');
 let deathStart=null;
 for(let i=0;i<180;i++){
  await engage();await advance(34);const st=await state();
  const enemy=st.visibleEnemies.find(e=>e.id==='spider');
  if(enemy?.hp===0){await page.mouse.up();deathStart=st.visuals.actors[6].deathProgress;await shot('05-collapse-start');break;}
 }
 assert.notEqual(deathStart,null,'spider defeated');await advance(200);await shot('06-collapse-middle');const middle=(await state()).visuals.actors[6];assert.ok(middle.deathProgress>deathStart&&middle.deathProgress<1);
 await advance(400);await shot('07-wreck');assert.equal((await state()).visuals.actors[6].deathProgress,1);
 const sounds=await page.evaluate(()=>window.audioEvents.map(e=>e.file));assert.ok(sounds.some(s=>s.includes('rail-charge')));assert.ok(sounds.some(s=>s.includes('rail-spider-shot')));assert.ok(sounds.some(s=>s.includes('robot-death')));
 assert.ok(walking.has('spider'));assert.deepEqual(errors,[]);await writeFile(`${dir}/report.json`,JSON.stringify({status:'passed',walking:[...walking],deathStart,middle,sounds,errors},null,2));console.log('Spider encounter passed');
}catch(e){await shot('failure');console.error(e,await state());process.exitCode=1;}finally{await browser.close();}
