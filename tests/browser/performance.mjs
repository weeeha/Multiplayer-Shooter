import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import os from 'node:os';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080}});
try{
  await page.goto('http://127.0.0.1:5173/');await page.locator('#start-btn').click();
  const capture=page.evaluate(()=>new Promise(resolve=>{
    const intervals=[];let previous=performance.now();const start=previous;
    const tick=now=>{intervals.push(now-previous);previous=now;if(now-start>=60000)resolve({intervals,elapsedMs:now-start});else requestAnimationFrame(tick);};
    requestAnimationFrame(tick);
  }));
  for(let i=0;i<30;i++){
    await page.keyboard.down('KeyD');await page.waitForTimeout(1000);await page.keyboard.up('KeyD');
    await page.keyboard.down('KeyA');await page.waitForTimeout(1000);await page.keyboard.up('KeyA');
  }
  const {intervals,elapsedMs}=await capture;
  const sorted=[...intervals].sort((a,b)=>a-b);
  const graphics=await page.locator('canvas').evaluate(c=>{
    const gl=c.getContext('webgl2')||c.getContext('webgl');const ext=gl?.getExtension('WEBGL_debug_renderer_info');
    return {canvas:[c.width,c.height],renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable'};
  });
  const report={browser:browser.version(),mode:'headless Chromium; normal game entry, no deterministic hook; alternating movement for 60 seconds',platform:`${os.platform()} ${os.release()} ${os.arch()}`,cpu:os.cpus()[0].model,viewport:[1920,1080],...graphics,
    elapsedMs,frames:intervals.length,meanFps:intervals.length*1000/elapsedMs,medianFrameMs:sorted[Math.floor(sorted.length*.5)],p95FrameMs:sorted[Math.floor(sorted.length*.95)],maxFrameMs:sorted.at(-1),
    limitation:'Browser animation-frame scheduling during a local one-player/one-robot scene. Not a GPU benchmark, online load test, or guarantee on other hardware.'};
  await mkdir('output/browser-verification',{recursive:true});await writeFile('output/browser-verification/performance.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
