// Supplements the standard web-game runner with E/R, UI, resize and lifecycle checks.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const output='output/browser-verification';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:720}});
const errors=[];
const captureWarnings=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{
  if(m.type()==='warning'&&m.text().includes('GPU stall due to ReadPixels'))captureWarnings.push(m.text());
  else if(m.type()==='error'||m.type()==='warning')errors.push(m.text());
});
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const advance=async(ms)=>{await page.evaluate(ms=>window.advanceTime(ms),ms);};
const key=async(code,ms)=>{await page.keyboard.down(code);await advance(ms);await page.keyboard.up(code);};
const tap=async(code)=>{await page.keyboard.press(code);await advance(34);};
const shot=async(name)=>{
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:`${output}/${name}.png`});
  await writeFile(`${output}/${name}.json`,JSON.stringify(await state(),null,2));
};
const aim=async(x,y)=>{
  const s=await state(),box=await page.locator('canvas').boundingBox();
  const sx=Math.max(0,Math.min(640,s.player.x-480)),sy=Math.max(0,Math.min(740,s.player.y-270));
  await page.mouse.move(box.x+(x-sx)*box.width/960,box.y+(y-15-sy)*box.height/540);
};
const restart=async()=>{
  await page.reload();await page.locator('#start-btn').click();await advance(34);
};
const report={browser:browser.version(),checks:[]};
try {
  await page.goto('http://127.0.0.1:5173/?test=1');
  await page.locator('#start-btn').click();await advance(34);
  let s=await state();assert.equal(s.player.hp,100);assert.equal(s.visibleRobot,null);
  await shot('01-start');report.checks.push('Start, hidden robot, full health and ammunition');

  await key('KeyD',1600);await key('KeyW',550);
  s=await state();assert.equal(s.nearbyDoors[0]?.id,'north-door');assert.equal(s.nearbyDoors[0]?.open,false);
  await tap('KeyE');assert.equal((await state()).nearbyDoors[0].open,true);
  await shot('02-open-door');
  await key('KeyW',300);s=await state();assert.ok(s.player.y<404,'entered north building');
  await key('KeyS',150);await tap('KeyE');assert.equal((await state()).nearbyDoors[0].open,true,'occupied door stays open');
  await key('KeyW',250);assert.ok((await state()).player.y<392,'body clears door before closing');
  await tap('KeyE');assert.equal((await state()).nearbyDoors[0].open,false);
  await shot('03-inside-closed');report.checks.push('Door open/close, entry, occupied-door rejection, room visibility');

  s=await state();await aim(s.player.x,s.player.y+120);
  await page.mouse.down();await advance(300);await page.mouse.up();await advance(100);
  s=await state();assert.ok(s.player.ammo<12);assert.equal(s.visibleProjectiles.length,0,'wall intercepted outgoing bullets');
  const used=12-s.player.ammo;await tap('KeyR');assert.ok((await state()).player.reloadRemaining>0);
  await advance(1250);s=await state();assert.equal(s.player.ammo,12);assert.equal(s.player.reserve,48-used);
  report.checks.push('Wall shooting, ammo consumption and completed reload');

  await page.getByRole('button',{name:'Open field settings'}).click();
  const beforeSettings=(await state()).player.ammo;
  await page.locator('#dash-toggle').uncheck();await page.locator('#debug-toggle').check();
  await page.locator('#resume-btn').click();await advance(34);
  s=await state();assert.equal(s.dashEnabled,false);assert.equal(s.player.ammo,beforeSettings);
  await shot('04-debug');report.checks.push('Settings do not fire; dash and geometry toggles work');

  await restart();await key('KeyD',1000);
  await aim(700,570);await advance(34);const before=(await state()).player.aim;
  await page.setViewportSize({width:1060,height:800});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await aim(700,570);await advance(34);const after=(await state()).player.aim;
  assert.ok(Math.abs(before.x-after.x)<.01&&Math.abs(before.y-after.y)<.01,'aim preserved after resize');
  assert.deepEqual(await page.locator('canvas').evaluate(c=>[c.width,c.height]),[960,540]);
  report.checks.push('Fixed logical viewport and aim survive aspect-ratio change');
  await page.setViewportSize({width:1280,height:720});

  await restart();await key('KeyW',300);await key('KeyD',3700);
  s=await state();assert.ok(s.visibleRobot,'robot visible after approaching along north side of street');
  await shot('05-contact');
  for(let i=0;i<36;i++){
    s=await state();if(s.mode==='dead'||s.visibleRobot?.hp===0)break;
    if(s.visibleRobot){await aim(s.visibleRobot.x,s.visibleRobot.y);await page.mouse.down();}else await page.mouse.up();
    await advance(50);
  }
  await page.mouse.up();s=await state();assert.equal(s.visibleRobot?.hp,0,'aimed pistol fire disables robot');
  await shot('06-patrol-disabled');report.checks.push('Approach, robot telegraph, aimed combat and robot death');

  await restart();await key('KeyW',300);await key('KeyD',3700);await advance(9000);
  assert.equal((await state()).mode,'dead');await shot('07-death');
  await page.locator('#retry-btn').click();s=await state();assert.equal(s.player.hp,100);assert.equal(s.player.ammo,12);assert.equal(s.time,0);
  report.checks.push('Robot can kill player; restart restores full local state');

  await page.goto('http://127.0.0.1:5173/');await page.locator('#start-btn').waitFor();
  assert.equal(await page.evaluate(()=>typeof window.render_game_to_text),'undefined');
  assert.equal(await page.evaluate(()=>typeof window.advanceTime),'undefined');
  await page.screenshot({path:`output/browser-verification/08-entry.png`});
  await page.locator('#start-btn').click();
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  assert.equal(await page.locator('.paused').isVisible(),true);
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal(await page.locator('.paused').isVisible(),false);
  report.checks.push('Normal entry omits test hooks and pauses/resumes on focus events');
  assert.deepEqual(errors,[],'no browser warnings or errors');
  report.status='passed';report.captureWarningCount=captureWarnings.length;console.log(JSON.stringify(report,null,2));
} catch(error) {
  report.status='failed';report.error=String(error);report.errors=errors;
  await page.screenshot({path:`${output}/failure.png`});
  try{report.state=await state();}catch{}
  console.error(JSON.stringify(report,null,2));process.exitCode=1;
} finally {
  await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));await browser.close();
}
