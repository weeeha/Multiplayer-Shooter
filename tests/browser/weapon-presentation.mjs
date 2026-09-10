import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='output/weapon-presentation';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.addInitScript(()=>{
 window.audioShots=[];window.audioContexts=[];
 const Native=window.AudioContext;
 window.AudioContext=class extends Native{constructor(...args){super(...args);window.audioContexts.push(this);}createBufferSource(){const s=super.createBufferSource(),start=s.start.bind(s);s.start=(...args)=>{window.audioShots.push({duration:s.buffer?.duration,time:args[0],rate:s.playbackRate.value});return start(...args);};return s;}};
});
const advance=ms=>page.evaluate(ms=>window.advanceTime(ms),ms);
try{
 await page.goto('http://127.0.0.1:5173/?test=1');await page.screenshot({path:`${dir}/entry.png`});await page.locator('#start-btn').click();await advance(34);
 assert.equal(await page.evaluate(()=>window.audioContexts[0].state),'running');
 const canvas=await page.locator('canvas').boundingBox();await page.mouse.move(canvas.x+canvas.width*.7,canvas.y+canvas.height*.45);
 for(const [key,gun,length] of [['1','pistol',.48],['2','ar',.38],['3','shotgun',.85]]){
  const before=await page.evaluate(()=>window.audioShots.length);await page.keyboard.press(key);await advance(34);
  assert.equal(await page.evaluate(()=>window.audioShots.length),before,'switch must not fire audio');
  await page.screenshot({path:`${dir}/${gun}-grip.png`});
  await page.mouse.down();await advance(34);await page.mouse.up();
  const shots=await page.evaluate(()=>window.audioShots);assert.equal(shots.length,before+1);assert.ok(Math.abs(shots.at(-1).duration-length)<.001);
  await advance(900);
 }
 await page.keyboard.press('2');await advance(34);const before=await page.evaluate(()=>window.audioShots.length);
 await page.mouse.down();for(let i=0;i<8;i++)await advance(50);await page.mouse.up();assert.ok(await page.evaluate(()=>window.audioShots.length)>=before+4);
 await page.keyboard.press('r');await advance(34);assert.ok(await page.locator('.ammo').evaluate(e=>e.classList.contains('reloading')));
 await page.screenshot({path:`${dir}/reload.png`});
 for(const [width,height] of [[900,1000],[600,700]]){
  await page.setViewportSize({width,height});await advance(34);
  const boxes=await Promise.all(['.health','.armor','.ammo','.weapon-rack'].map(s=>page.locator(s).boundingBox()));
  for(const b of boxes)assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=width&&b.y+b.height<=height);
  const [h,a,ammo,rack]=boxes;assert.ok(a.x+a.width<=rack.x||a.y+a.height<=rack.y||rack.y+rack.height<=a.y,'armor/rack overlap');
  await page.screenshot({path:`${dir}/hud-${width}.png`});
 }
 // Render exactly the cached sample generator to a listenable comparison file.
 const samples=await page.evaluate(async()=>{
  const {synthesizeShot}=await import('/src/client/gunAudio.ts');const rate=24000,data=new Float32Array(rate*5);
  for(const [i,gun] of ['pistol','ar','shotgun'].entries()){const a=synthesizeShot(gun,rate,9271);data.set(a.map(v=>v*.48),Math.floor((.3+i*1.5)*rate));}return Array.from(data);
 });
 const wav=Buffer.alloc(44+samples.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(24000,24);wav.writeUInt32LE(48000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples.length*2,40);samples.forEach((v,i)=>wav.writeInt16LE(Math.round(v*32767),44+i*2));await writeFile(`${dir}/gun-comparison.wav`,wav);
 assert.deepEqual(errors,[]);const report={status:'passed',checks:['Audio unlocked','Distinct samples for all weapons','No switch noise','Automatic fire','Reload feedback','Responsive HUD'],errors};await writeFile(`${dir}/report.json`,JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close();}
