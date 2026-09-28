import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

// WebKit's font-ready promise waits for the deliberately held module request.
// The startup screen uses only system fonts, so capture its actual first paint.
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const url=process.env.GAME_URL??'http://127.0.0.1:4174/';
const output=process.env.STARTUP_OUTPUT??'output/startup-verification';
await mkdir(output,{recursive:true});
const reports=[];
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  const report={engine:name,checks:[]};
  try{
    // Catch a blank first paint while the game bundle is still downloading.
    const cold=await browser.newPage({viewport:{width:1280,height:800}});
    let releaseScripts;
    const scriptsReady=new Promise(resolve=>{releaseScripts=resolve;});
    await cold.route('**/*',async route=>{
      if(route.request().resourceType()==='script')await scriptsReady;
      await route.continue();
    });
    await cold.goto(url,{waitUntil:'commit'});
    try{
      await cold.locator('#startup').waitFor({state:'visible',timeout:5000});
      assert.match(await cold.locator('#startup').innerText(),/loading/i);
      await cold.screenshot({path:`${output}/${name}-loading.png`});
      report.checks.push('Loading screen is visible before JavaScript downloads');
    }finally{releaseScripts();}
    await cold.close();

    const page=await browser.newPage({viewport:{width:1280,height:800}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    // Catch an asset failure being silently replaced with an empty game.
    await page.route('**/art/cold-relay/props-key.png',route=>route.fulfill({status:404,body:'missing'}));
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.locator('#startup[data-state="error"]').waitFor({timeout:60000});
    assert.match(await page.locator('#startup').innerText(),/reload/i);
    assert.equal(await page.locator('#start-btn').isVisible(),false);
    await page.screenshot({path:`${output}/${name}-error.png`});
    report.checks.push('Failed artwork shows a recoverable error');

    await page.unroute('**/art/cold-relay/props-key.png');
    await page.locator('#startup-retry').click();
    await page.locator('#start-btn').waitFor({state:'visible',timeout:60000});
    assert.equal(await page.locator('#startup').count(),0);
    await page.locator('#start-btn').click();
    await page.locator('.condition').waitFor({state:'visible'});
    assert.equal(await page.locator('canvas').count(),1);
    await page.screenshot({path:`${output}/${name}-playing.png`});
    assert.deepEqual(errors,[]);
    report.checks.push('Reload recovers, removes loading screen and enters the game without page errors');
    report.status='passed';
  }catch(error){report.status='failed';report.error=String(error);process.exitCode=1;}
  finally{await browser.close();reports.push(report);console.log(JSON.stringify(report));}
}
await writeFile(`${output}/report.json`,JSON.stringify(reports,null,2));
