import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='output/cold-relay-verification';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const advance=ms=>page.evaluate(ms=>window.advanceTime(ms),ms);
const key=async(k,ms)=>{await page.keyboard.down(k);await advance(ms);await page.keyboard.up(k);};
const aim=async(x,y)=>{const s=await state(),b=await page.locator('canvas').boundingBox();const sx=Math.max(0,Math.min(640,s.player.x-480)),sy=Math.max(0,Math.min(740,s.player.y-270));await page.mouse.move(b.x+(x-sx)*b.width/960,b.y+(y-24-sy)*b.height/540);};
const shot=async name=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:`${dir}/${name}.png`});await writeFile(`${dir}/${name}.json`,JSON.stringify(await state(),null,2));};
const restart=async()=>{await page.goto('http://127.0.0.1:5173/?test=1');await page.locator('#start-btn').click();await advance(34);};
try{
 await restart();let s=await state();assert.equal(s.visuals.direction,'cold-relay');assert.equal(s.visuals.spriteCount,6);await shot('01-street');
 await aim(500,570);await page.mouse.down();await advance(34);await page.mouse.up();s=await state();assert.ok(s.visuals.particles>=2);await shot('02-muzzle');
 await key('KeyD',1600);await key('KeyW',550);await aim(532,410);await page.mouse.down();await advance(67);await page.mouse.up();await advance(33);await shot('03-door-impact');
 assert.ok((await state()).visuals.particles>2);
 await restart();await key('KeyW',300);await key('KeyD',3700);await shot('04-robot');
 for(let i=0;i<36;i++){
  s=await state();if(s.mode==='dead'||s.visibleRobot?.hp===0)break;
  if(s.visibleRobot){await aim(s.visibleRobot.x,s.visibleRobot.y);await page.mouse.down();}
  await advance(50);
 }
 await page.mouse.up();s=await state();assert.equal(s.visibleRobot?.hp,0);assert.ok(s.visuals.particles>10);assert.ok(s.visuals.particles<=240);await shot('05-robot-sparks');
 await page.getByRole('button',{name:'Open field settings'}).click();await page.locator('#restart-btn').click();await advance(34);assert.equal((await state()).visuals.particles,0);await shot('06-reset');
 assert.deepEqual(errors,[]);const report={status:'passed',checks:['Generated artwork loaded','Six character renderers','Muzzle/casing effects','Closed door impacts','Robot impact and destruction sparks','Bounded particles','Restart clears effects'],errors};console.log(report);await writeFile(`${dir}/report.json`,JSON.stringify(report,null,2));
}catch(e){await shot('failure');console.error(e,await state());process.exitCode=1;}finally{await browser.close();}
