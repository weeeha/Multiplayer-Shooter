import {captureAudio,waitForAudio} from './audio-capture.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='output/weapon-presentation';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await captureAudio(page);
const advance=ms=>page.evaluate(ms=>window.advanceTime(ms),ms);
try{
 await page.goto('http://127.0.0.1:5173/?test=1');await page.locator('#start-btn').waitFor({state:'visible'});await page.screenshot({path:`${dir}/entry.png`});await page.locator('#start-btn').click();await advance(34);
 const audio=await waitForAudio(page);for(const name of ['pistol','ar','shotgun'])assert.ok(audio.recorded.includes(name));
 const shots=()=>page.evaluate(()=>window.audioEvents.filter(e=>/\/(pistol|ar|shotgun)-\d+\.wav$/.test(e.file)));
 const canvas=await page.locator('canvas').boundingBox();await page.mouse.move(canvas.x+canvas.width*.7,canvas.y+canvas.height*.45);
 for(const [key,gun] of [['1','pistol'],['2','ar'],['3','shotgun']]){
  const before=(await shots()).length;await page.keyboard.press(key);await advance(34);
  assert.equal((await shots()).length,before,'switch must not fire audio');
  await page.screenshot({path:`${dir}/${gun}-grip.png`});
  await page.mouse.down();await advance(34);await page.mouse.up();
  const fired=await shots();assert.equal(fired.length,before+1);assert.ok(fired.at(-1).file.includes('/'+gun+'-'));
  await advance(900);
 }
 await page.keyboard.press('2');await advance(34);const before=(await shots()).length;
 await page.mouse.down();for(let i=0;i<8;i++)await advance(50);await page.mouse.up();assert.ok((await shots()).length>=before+4);
 await page.keyboard.press('r');await advance(34);assert.ok(await page.locator('.ammo').evaluate(e=>e.classList.contains('reloading')));
 await page.screenshot({path:`${dir}/reload.png`});
 for(const [width,height] of [[900,1000],[600,700]]){
  await page.setViewportSize({width,height});await advance(34);
  const boxes=await Promise.all(['.health','.armor','.ammo','.weapon-rack'].map(s=>page.locator(s).boundingBox()));
  for(const b of boxes)assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=width&&b.y+b.height<=height);
  const [h,a,ammo,rack]=boxes;assert.ok(a.x+a.width<=rack.x||a.y+a.height<=rack.y||rack.y+rack.height<=a.y,'armor/rack overlap');
  await page.screenshot({path:`${dir}/hud-${width}.png`});
 }
 assert.deepEqual(errors,[]);const report={status:'passed',checks:['Audio unlocked','Distinct samples for all weapons','Weapon handling does not trigger gunfire','Automatic fire','Reload feedback','Responsive HUD'],errors};await writeFile(`${dir}/report.json`,JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close();}
