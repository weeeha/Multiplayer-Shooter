import {captureAudio,waitForAudio} from './audio-capture.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='output/dog-bite';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await captureAudio(page);
const state=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
const advance=ms=>page.evaluate(ms=>window.advanceTime(ms),ms);
const walk=async(key,ms)=>{await page.keyboard.down(key);await advance(ms);await page.keyboard.up(key);};
try{
 await page.goto('http://127.0.0.1:5173/?test=1');await page.locator('#start-btn').click();await waitForAudio(page);await advance(34);
 await walk('KeyS',2450);await walk('KeyD',2750);
 let windup,contact;const before=(await state()).player.armor;
 for(let i=0;i<100;i++){
  await advance(34);const s=await state(),dog=s.visuals.actors.find(a=>a.texture.includes('dog')||a.texture.startsWith('character-4'));
  if(dog?.biting&&!windup){windup=s;await page.screenshot({path:`${dir}/windup.png`});}
  if(dog?.biting&&s.player.armor<before){contact=s;await page.screenshot({path:`${dir}/contact.png`});break;}
 }
 assert.ok(windup,'visible bite animation');assert.ok(contact,'bite deals contact damage');assert.ok((await page.evaluate(()=>window.audioEvents.filter(e=>e.file.includes('dog-bite')))).length>0,'bite reaches audio output');
 const armor=contact.player.armor;await walk('KeyA',200);assert.equal((await state()).player.armor,armor,'no repeated damage during recovery');
 await page.locator('.settings-button').click();const paused=(await state()).time;await advance(1000);assert.equal((await state()).time,paused);
 await page.locator('#restart-btn').click();await advance(34);assert.equal((await state()).player.armor,50);assert.ok((await state()).visuals.actors.every(a=>!a.biting));
 assert.deepEqual(errors,[]);await writeFile(`${dir}/report.json`,JSON.stringify({status:'passed',windup,contact,errors},null,2));console.log('Dog bite animation, damage, recovery, audio, pause and restart passed.');
}catch(e){await page.screenshot({path:`${dir}/failure.png`});console.error(e,await state());process.exitCode=1;}finally{await browser.close();}
