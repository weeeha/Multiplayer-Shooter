import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {captureAudio,waitForAudio} from './audio-capture.mjs';
const dir='output/player-railgun';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));await captureAudio(page);
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text())),advance=ms=>page.evaluate(ms=>window.advanceTime(ms),ms);
const shot=async name=>{await page.screenshot({path:`${dir}/${name}.png`});await writeFile(`${dir}/${name}.json`,JSON.stringify(await state(),null,2));};
try{
 await page.goto('http://127.0.0.1:5173/?test=1');await page.locator('#start-btn').click({timeout:60000});await waitForAudio(page);await advance(34);
 await page.keyboard.press('4');await advance(34);assert.equal((await state()).player.weapon,'railgun');assert.equal((await state()).player.ammo,2);assert.equal((await state()).player.reserve,0);
 assert.equal(await page.locator('[data-weapon="railgun"]').getAttribute('aria-pressed'),'true');assert.ok(await page.locator('.equipped-gun').evaluate(i=>i.complete&&i.naturalWidth>0));
 const b=await page.locator('canvas').boundingBox();
 for(const [name,x,y] of [['east',650,270],['south',180,470],['north',180,60],['west',50,270]]){await page.mouse.move(b.x+x*b.width/960,b.y+y*b.height/540);await advance(34);assert.ok((await state()).visuals.actors[0].texture.startsWith('walk-player-railgun-'));await shot(name);}
 await page.mouse.move(b.x+650*b.width/960,b.y+270*b.height/540);await page.mouse.down();await advance(34);await page.mouse.up();await shot('first-shot');assert.equal((await state()).player.ammo,1);
 await page.keyboard.press('1');await advance(34);await page.locator('[data-weapon="railgun"]').click();await advance(34);assert.equal((await state()).player.ammo,1);
 await advance(1400);await page.mouse.move(b.x+650*b.width/960,b.y+270*b.height/540);await page.mouse.down();await advance(34);await page.mouse.up();await shot('last-shot');assert.equal((await state()).player.ammo,0);
 await page.keyboard.press('r');await page.mouse.down();await advance(2500);await page.mouse.up();assert.equal((await state()).player.ammo,0);assert.equal((await state()).player.reloadRemaining,0);assert.equal(await page.locator('#ammo-hint').textContent(),'NO AMMO · SWITCH WEAPON');
 const fired=await page.evaluate(()=>window.audioEvents.filter(e=>e.file.includes('rail-player-shot-')));assert.equal(fired.length,2);
 await page.keyboard.down('d');for(let i=0;i<8;i++)await advance(34);assert.ok((await state()).visuals.actors[0].walking);await page.keyboard.up('d');await advance(200);assert.equal((await state()).visuals.actors[0].walking,false);
 await page.getByRole('button',{name:'Open field settings'}).click();await page.locator('#restart-btn').click();await advance(34);await page.keyboard.press('4');await advance(34);assert.equal((await state()).player.ammo,2);
 for(const [width,height] of [[1060,800],[900,1000],[600,700],[430,700]]){await page.setViewportSize({width,height});await advance(34);const boxes=await Promise.all(['.condition','.ammo','.weapon-rack','.grenade-kit'].map(s=>page.locator(s).boundingBox()));for(const a of boxes)assert.ok(a.x>=0&&a.y>=0&&a.x+a.width<=width&&a.y+a.height<=height);for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y,`HUD overlap at ${width}`);}await shot(`hud-${width}`);}
 assert.deepEqual(errors,[]);await writeFile(`${dir}/report.json`,JSON.stringify({status:'passed',checks:['Key 4 and clickable slot','Dedicated art and holding/walking poses','Two shots with layered rail audio','No reload or switch refill','Restart refills','Responsive four-slot HUD'],errors},null,2));console.log('Player railgun checks passed');
}catch(e){await shot('failure');throw e;}finally{await browser.close();}
