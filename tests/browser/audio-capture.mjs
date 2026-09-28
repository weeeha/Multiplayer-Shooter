import assert from 'node:assert/strict';
export async function captureAudio(page){
 await page.addInitScript(()=>{
  window.audioEvents=[];const files=new WeakMap(),labels=new WeakMap(),fetchOriginal=window.fetch;
  window.fetch=async(...args)=>{const response=await fetchOriginal(...args),read=response.arrayBuffer.bind(response);response.arrayBuffer=async()=>{const data=await read();files.set(data,response.url);return data;};return response;};
  const decode=AudioContext.prototype.decodeAudioData,create=AudioContext.prototype.createBufferSource;
  AudioContext.prototype.decodeAudioData=function(data,...args){const result=decode.call(this,data,...args);result.then(buffer=>labels.set(buffer,files.get(data)));return result;};
  AudioContext.prototype.createBufferSource=function(){const source=create.call(this),start=source.start.bind(source);source.start=(...args)=>{window.audioEvents.push({file:labels.get(source.buffer)??'synthetic',duration:source.buffer?.duration,loop:source.loop,time:args[0]});return start(...args);};return source;};
 });
}
export async function waitForAudio(page){
 await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).visuals.audio.decoded);
 const audio=await page.evaluate(()=>JSON.parse(window.render_game_to_text()).visuals.audio);assert.deepEqual(audio.failures,[]);return audio;
}
