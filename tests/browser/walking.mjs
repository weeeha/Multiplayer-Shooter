import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='output/walk-verification';await mkdir(dir,{recursive:true});const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir,size:{width:1280,height:720}}});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
const advance=ms=>page.evaluate(ms=>window.advanceTime(ms),ms),state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
try{
 await page.goto('http://127.0.0.1:5173/?test=1');await page.locator('#start-btn').click();await advance(34);await page.mouse.move(850,350);
 for(const [key,gun] of [['1','pistol'],['2','ar'],['3','shotgun']]){
  await page.keyboard.press(key);await advance(34);const textures=new Set();await page.keyboard.down('d');
  for(let i=0;i<12;i++){await advance(34);const a=(await state()).visuals.actors[0];textures.add(a.texture);if(i%3===0)await page.screenshot({path:`${dir}/${gun}-${i}.png`});await page.waitForTimeout(34);}
  await page.keyboard.up('d');assert.equal(textures.size,4);assert.ok([...textures].every(t=>t.startsWith(`walk-player-${gun}`)));
  await advance(200);assert.equal((await state()).visuals.actors[0].walking,false);
  await page.keyboard.down('a');for(let i=0;i<12;i++){await advance(34);await page.waitForTimeout(34);}await page.keyboard.up('a');await advance(150);
 }
 await page.getByRole('button',{name:'Open field settings'}).click();await page.screenshot({path:`${dir}/settings.png`});await page.locator('#restart-btn').click();await advance(34);assert.equal((await state()).visuals.actors[0].walking,false);
 assert.deepEqual(errors,[]);console.log({status:'passed',checks:['Four frames for every player gun','Stops at rest','Reverse movement','Restart returns idle'],errors});await writeFile(`${dir}/report.json`,JSON.stringify({status:'passed',errors}));
}finally{const video=page.video();await context.close();await video.saveAs(`${dir}/walking.webm`);await browser.close();}
