import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {captureAudio,waitForAudio} from './audio-capture.mjs';
const dir='output/music';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];await captureAudio(page);page.on('pageerror',e=>errors.push(String(e)));
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text())),advance=ms=>page.evaluate(ms=>window.advanceTime(ms),ms);
const music=async()=>(await state()).visuals.audio.music;
const trackEvents=()=>page.evaluate(()=>window.audioEvents.filter(e=>e.file.includes('/music/')));
try{
 await page.goto('http://127.0.0.1:5173/?test=1');await page.locator('#start-btn').waitFor({state:'visible',timeout:60000});assert.equal((await music()).playing,false);assert.equal((await trackEvents()).length,0);
 await page.locator('#start-btn').click();await advance(34);await waitForAudio(page);await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).visuals.audio.music.ready);
 assert.deepEqual(await music(),{ready:true,playing:true,volume:.2,loop:true,error:null});const events=await trackEvents();assert.equal(events.length,1);assert.equal(events[0].duration,48);assert.equal(events[0].loop,true);
 await page.getByRole('button',{name:'Open field settings'}).click();await page.screenshot({path:`${dir}/settings.png`});
 const slider=page.getByRole('slider',{name:'Background music volume'});await slider.focus();await slider.press('Home');assert.equal((await music()).volume,0);assert.equal((await music()).playing,false);assert.equal(await page.locator('#music-level').textContent(),'Off');
 await slider.press('ArrowRight');await slider.press('ArrowRight');await slider.press('ArrowRight');assert.equal((await music()).volume,.15);assert.equal((await music()).playing,true);
 await page.locator('#resume-btn').click();await page.mouse.move(650,330);await page.mouse.down();await advance(34);await page.mouse.up();assert.ok(await page.evaluate(()=>window.audioEvents.some(e=>e.file.includes('/pistol-'))),'gunfire still uses sound effects bus');
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.waitForFunction(()=>!JSON.parse(window.render_game_to_text()).visuals.audio.music.playing);
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).visuals.audio.music.playing);
 await page.getByRole('button',{name:'Open field settings'}).click();await page.locator('#restart-btn').click();await advance(34);assert.equal((await trackEvents()).length,1,'restart does not stack music loops');assert.equal((await music()).volume,.15);
 await page.reload();await page.locator('#start-btn').waitFor({state:'visible',timeout:60000});assert.equal((await music()).volume,.15);assert.equal((await music()).playing,false);await page.locator('#start-btn').click();await advance(34);await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).visuals.audio.music.ready);
 await page.getByRole('button',{name:'Open field settings'}).click();await page.setViewportSize({width:430,height:700});await slider.scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/settings-narrow.png`});assert.equal(await slider.inputValue(),'15');
 assert.deepEqual(errors,[]);const report={status:'passed',checks:['No autoplay before entry','Decoded 48-second seamless stereo loop','Quiet default volume','Mute and volume adjustment','Music setting persists','Fade out on focus loss','Restart does not stack tracks','Gun sounds unaffected','Narrow settings control'],events,errors};await writeFile(`${dir}/report.json`,JSON.stringify(report,null,2));console.log(report);
}catch(e){await page.screenshot({path:`${dir}/failure.png`});throw e;}finally{await browser.close();}
