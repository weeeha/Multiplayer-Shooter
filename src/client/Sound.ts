import type {World} from '../shared/model';
import {ShotQueue,synthesizeShot,type Gun} from './gunAudio';
export class FieldSound {
  private context:AudioContext|null=null;
  private master:GainNode|null=null;
  private queue=new ShotQueue();
  private buffers=new Map<Gun,AudioBuffer[]>();
  private voices=new Set<AudioBufferSourceNode>();
  unlock():void {
    this.stop();this.queue.reset();
    if(!this.context){
      const c=this.context=new AudioContext();
      this.master=c.createGain();this.master.gain.value=.48;
      const limiter=c.createDynamicsCompressor();limiter.threshold.value=-8;limiter.knee.value=6;limiter.ratio.value=12;limiter.attack.value=.002;limiter.release.value=.12;
      this.master.connect(limiter);limiter.connect(c.destination);
      for(const gun of ['pistol','ar','shotgun','explosion','flesh-hit','metal-hit'] as const)this.buffers.set(gun,Array.from({length:4},(_,i)=>{
        const samples=synthesizeShot(gun,c.sampleRate,9271+i*173),b=c.createBuffer(1,samples.length,c.sampleRate);b.copyToChannel(samples,0);return b;
      }));
    }
    void this.context.resume();
  }
  update(w:World):void {
    const shots=this.queue.take(w),c=this.context;if(!c||c.state!=='running')return;
    for(const s of shots){
      if(this.voices.size>=24){const oldest=this.voices.values().next().value!;oldest.stop();this.voices.delete(oldest);}
      const source=c.createBufferSource(),gain=c.createGain(),pan=c.createStereoPanner();
      source.buffer=this.buffers.get(s.weapon)![s.id%4];source.playbackRate.value=1+((s.id*13%11)-5)*.004;
      gain.gain.value=s.volume;pan.pan.value=s.pan;
      source.connect(gain);gain.connect(pan);pan.connect(this.master!);this.voices.add(source);
      source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();pan.disconnect();};
      source.start(c.currentTime+s.delay);
    }
  }
  stop():void {for(const s of this.voices)s.stop();this.voices.clear();}
  destroy():void {this.stop();void this.context?.close();}
}
