const STORAGE_KEY='cold-relay.music-volume';
export class AmbientMusic {
  private context:AudioContext|null=null;
  private gain:GainNode|null=null;
  private source:AudioBufferSourceNode|null=null;
  private active=false;
  private destroyed=false;
  private loading=false;
  private error:string|null=null;
  private level=.2;
  private prepared=fetch('/audio/music/cold-relay-ambient.wav').then(r=>{
    if(!r.ok)throw new Error('Ambient track unavailable');return r.arrayBuffer();
  }).catch(error=>{this.error=String(error);return null;});
  constructor(){
    try{const saved=localStorage.getItem(STORAGE_KEY);if(saved!==null&&Number.isFinite(Number(saved)))this.level=Math.max(0,Math.min(1,Number(saved)));}catch{/* Storage may be unavailable in private browser sessions. */}
  }
  get volume():number{return this.level;}
  unlock(context:AudioContext):void {
    if(this.loading||this.destroyed)return;
    this.loading=true;this.context=context;
    this.gain=context.createGain();this.gain.gain.value=0;this.gain.connect(context.destination);
    void this.prepared.then(async bytes=>{
      if(!bytes||this.destroyed)return;
      try{
        const buffer=await context.decodeAudioData(bytes);if(this.destroyed)return;
        const source=context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(this.gain!);
        this.source=source;source.start();this.applyVolume();
      }catch(error){this.error=String(error);}
    });
  }
  setVolume(value:number):void {
    if(!Number.isFinite(value))return;this.level=Math.max(0,Math.min(1,value));
    try{localStorage.setItem(STORAGE_KEY,String(this.level));}catch{/* The control still works without persistence. */}
    this.applyVolume();
  }
  setActive(active:boolean):void {if(active===this.active)return;this.active=active;this.applyVolume();}
  private applyVolume():void {
    if(!this.context||!this.gain)return;
    // Separate quiet music bus keeps weapon/footstep levels unchanged.
    this.gain.gain.setTargetAtTime(this.active?this.level*.3:0,this.context.currentTime,.18);
  }
  state(){return {ready:this.source!==null,playing:this.source!==null&&this.active&&this.level>0,volume:this.level,loop:this.source?.loop??false,error:this.error};}
  destroy():void {this.destroyed=true;this.source?.stop();this.source?.disconnect();this.source=null;this.gain?.disconnect();}
}
