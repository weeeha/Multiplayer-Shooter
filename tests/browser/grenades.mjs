import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='output/grenade-verification';await mkdir(dir,{recursive:true});const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));const advance=ms=>page.evaluate(ms=>window.advanceTime(ms),ms),state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const aim=async(x,y)=>{const s=await state(),b=await page.locator('canvas').boundingBox(),sx=Math.max(0,Math.min(640,s.player.x-480)),sy=Math.max(0,Math.min(740,s.player.y-270));await page.mouse.move(b.x+(x-sx)*b.width/960,b.y+(y-sy)*b.height/540);};
const shot=async name=>{await page.screenshot({path:`${dir}/${name}.png`});await writeFile(`${dir}/${name}.json`,JSON.stringify(await state(),null,2));};
try{
 await page.goto('http://127.0.0.1:5173/?test=1');await page.locator('#start-btn').click();await advance(34);
 for(const [key,gun] of [['1','pistol'],['2','ar'],['3','shotgun']]){
  await page.keyboard.press(key);
  for(const [name,x,y] of [['south',180,690],['southeast',280,646],['east',320,546],['north',180,420],['west',40,546]]){
   await aim(x,y);await advance(34);await shot(`${gun}-${name}`);
  }
 }
 await aim(390,570);await page.keyboard.down('g');await advance(230);await shot('grenade-arc');assert.equal((await state()).grenadeCount,2);assert.equal((await state()).grenades.length,1);
 await advance(1170);await page.keyboard.up('g');await shot('grenade-blast');assert.equal((await state()).grenades.length,0);assert.equal((await state()).grenadeCount,2,'holding G must throw once');assert.ok((await state()).visuals.particles>=30);
 await aim(180,570);await page.keyboard.press('g');await advance(1450);assert.ok((await state()).player.hp<100);assert.equal((await state()).player.armor,0);await shot('self-damage');
 await page.getByRole('button',{name:'Open field settings'}).click();await page.locator('#restart-btn').click();await advance(34);assert.equal((await state()).grenadeCount,3);assert.equal((await state()).player.hp,100);
 assert.deepEqual(errors,[]);const report={status:'passed',checks:['All weapon poses at five bearings','Grenade arc and blast','One throw per press','Self damage and armor','Restart refills grenades'],errors};console.log(report);await writeFile(`${dir}/report.json`,JSON.stringify(report,null,2));
}finally{await browser.close();}
