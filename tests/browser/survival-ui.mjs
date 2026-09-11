import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='output/survival-ui';await mkdir(dir,{recursive:true});const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
const advance=ms=>page.evaluate(ms=>window.advanceTime(ms),ms),state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
try{
 await page.goto('http://127.0.0.1:5173/?test=1');await page.locator('#start-btn').waitFor({state:'visible'});await page.screenshot({path:`${dir}/01-entry.png`});
 await page.locator('[data-start-weapon="ar"]').click();assert.equal(await page.locator('[data-start-weapon="ar"]').getAttribute('aria-pressed'),'true');await page.locator('#start-btn').click();await advance(34);assert.equal((await state()).player.weapon,'ar');assert.equal((await state()).player.ammo,30);await page.screenshot({path:`${dir}/02-hud.png`});
 await page.getByRole('button',{name:'Open field settings'}).click();await advance(34);await page.screenshot({path:`${dir}/03-settings.png`});
 await page.locator('#dash-toggle').uncheck();await page.locator('#resume-btn').click();await advance(34);assert.equal((await state()).dashEnabled,false);
 await page.locator('[data-weapon="shotgun"]').click();await advance(34);assert.equal((await state()).player.weapon,'shotgun');
 for(const [width,height] of [[900,1000],[600,700],[430,700]]){
  await page.setViewportSize({width,height});await advance(34);
  const selectors=['.condition','.ammo','.weapon-rack','.grenade-kit'],boxes=await Promise.all(selectors.map(s=>page.locator(s).boundingBox()));
  for(const b of boxes)assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=width&&b.y+b.height<=height);
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y,`${selectors[i]} overlaps ${selectors[j]} at ${width}`);}
  await page.screenshot({path:`${dir}/hud-${width}.png`});
 }
 await page.goto('http://127.0.0.1:5173/?test=1');await page.locator('[data-start-weapon="shotgun"]').click();await page.locator('#start-btn').click();await advance(34);assert.equal((await state()).player.weapon,'shotgun');
 assert.deepEqual(errors,[]);const report={status:'passed',checks:['Starting weapon selection','Styled field HUD','Settings and resume','Clickable weapons','No HUD overlap at desktop/tall/narrow sizes'],errors};await writeFile(`${dir}/report.json`,JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close();}
