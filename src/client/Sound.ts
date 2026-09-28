import {AmbientMusic} from './AmbientMusic';
import type {World} from '../shared/model';
import {ShotQueue,synthesizeShot,type CombatSound} from './gunAudio';
import {CREATURE_SOUNDS} from './creatureAudio';
import {FoleyQueue,type FoleySound} from './FoleyQueue';
type SoundId=CombatSound|FoleySound;
export class FieldSound {
  private music=new AmbientMusic();
  get musicVolume():number{return this.music.volume;}
  setMusicVolume(value:number):void {this.music.setVolume(value);}
  setMusicActive(active:boolean):void {this.music.setActive(active);}
  private context:AudioContext|null=null;
  private master:GainNode|null=null;
  private queue=new ShotQueue();
  private foley=new FoleyQueue();
  private buffers=new Map<SoundId,AudioBuffer[]>();
  private recorded=new Set<string>();
  private failures:string[]=[];
  private decoded=false;
  private prepared=fetch('/audio/field/manifest.json').then(async response=>{
    if(!response.ok)throw new Error('Audio manifest unavailable');
    const manifest=await response.json() as Record<SoundId,string[]>;
    return Promise.all(Object.entries(manifest).map(async([id,urls])=>{
      const files=await Promise.all(urls.map(async url=>{const r=await fetch(url);if(!r.ok)throw new Error(url);return r.arrayBuffer();}));
      return {id:id as SoundId,files};
    }));
  }).catch(error=>{this.failures.push(String(error));return [];});
  private voices=new Set<AudioBufferSourceNode>();
  unlock():void {
    this.stop();this.queue.reset();this.foley.reset();
    if(!this.context){
      const c=this.context=new AudioContext();
      this.master=c.createGain();this.master.gain.value=.48;
      const limiter=c.createDynamicsCompressor();limiter.threshold.value=-8;limiter.knee.value=6;limiter.ratio.value=12;limiter.attack.value=.002;limiter.release.value=.12;
      this.master.connect(limiter);limiter.connect(c.destination);
      for(const gun of ['pistol','ar','shotgun','explosion','flesh-hit','metal-hit',...CREATURE_SOUNDS] as const)this.buffers.set(gun,Array.from({length:4},(_,i)=>{
        const samples=synthesizeShot(gun,c.sampleRate,9271+i*173),b=c.createBuffer(1,samples.length,c.sampleRate);b.copyToChannel(samples,0);return b;
      }));
      void this.prepared.then(async groups=>{
        await Promise.all(groups.map(async({id,files})=>{
          try{this.buffers.set(id,await Promise.all(files.map(file=>c.decodeAudioData(file))));this.recorded.add(id);}
          catch(error){this.failures.push(`${id}: ${String(error)}`);}
        }));this.decoded=true;
      });
    }
    void this.context.resume();this.music.unlock(this.context);
  }
  update(w:World):void {
    const shots=[...this.queue.take(w),...this.foley.take(w)],c=this.context;if(!c||c.state!=='running')return;
    for(const s of shots){
      const variants=this.buffers.get(s.weapon);if(!variants?.length)continue;
      if(this.voices.size>=24){const oldest=this.voices.values().next().value!;oldest.stop();this.voices.delete(oldest);}
      const source=c.createBufferSource(),gain=c.createGain(),pan=c.createStereoPanner();
      source.buffer=variants[s.id%variants.length];source.playbackRate.value=1+((s.id*13%11)-5)*.004;
      gain.gain.value=s.volume;pan.pan.value=s.pan;
      source.connect(gain);gain.connect(pan);pan.connect(this.master!);this.voices.add(source);
      source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();pan.disconnect();};
      source.start(c.currentTime+s.delay);
    }
  }
  state(){return {decoded:this.decoded,recorded:[...this.recorded],failures:[...this.failures],music:this.music.state()};}
  stop():void {for(const s of this.voices)s.stop();this.voices.clear();}
  destroy():void {this.music.destroy();this.stop();void this.context?.close();}
}
