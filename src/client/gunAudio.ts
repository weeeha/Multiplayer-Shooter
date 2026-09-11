import type {World} from '../shared/model';
export type Gun='pistol'|'ar'|'shotgun'|'explosion'|'flesh-hit'|'metal-hit';
export class ShotQueue {
  private last=-1;
  private hitTimes=new Map<string,number>();
  reset():void {this.last=-1;this.hitTimes.clear();}
  take(w:World):{weapon:Gun;volume:number;pan:number;delay:number;id:number}[] {
    const shots:{weapon:Gun;volume:number;pan:number;delay:number;id:number}[]=[];
    for(const e of w.events){
      if(e.id<=this.last)continue;this.last=e.id;
      const hit=e.kind==='impact'&&e.targetId!==undefined&&e.targetId!==w.player.id;
      if((e.kind!=='shot'&&e.kind!=='explosion'&&!hit)||(e.kind==='shot'&&!e.weapon)||w.time-e.time>.18)continue;
      if(hit){if(e.time-(this.hitTimes.get(e.targetId!)??-1)<.06)continue;this.hitTimes.set(e.targetId!,e.time);}
      const own=e.kind==='shot'&&e.actorId===w.player.id,dx=e.pos.x-w.player.pos.x,d=Math.hypot(dx,e.pos.y-w.player.pos.y);
      if(!own&&d>=850)continue;
      shots.push({weapon:hit?(e.material==='metal'?'metal-hit':'flesh-hit'):e.kind==='explosion'?'explosion' as const:e.weapon!,volume:own?1:(hit?.9:.8)*Math.pow(1-d/850,1.4),pan:own?0:Math.max(-.85,Math.min(.85,dx/480)),delay:e.time,id:e.id});
    }
    if(shots.length){const first=shots[0].delay;for(const s of shots)s.delay-=first;}
    return shots;
  }
}
// Original procedural samples: pressure transient, low body, action and diffuse tail.
// Cached at startup; no sample generation on the simulation tick.
export function synthesizeShot(gun:Gun,rate:number,seed:number):Float32Array<ArrayBuffer> {
  const p={'flesh-hit':{length:.18,body:125,decay:.035,crack:.012,tail:.03,action:.024},'metal-hit':{length:.26,body:1200,decay:.05,crack:.008,tail:.045,action:.01},explosion:{length:1.25,body:48,decay:.23,crack:.065,tail:.28,action:.12},pistol:{length:.48,body:145,decay:.055,crack:.017,tail:.085,action:.066},ar:{length:.38,body:110,decay:.048,crack:.024,tail:.07,action:.045},shotgun:{length:.85,body:72,decay:.13,crack:.045,tail:.17,action:.19}}[gun];
  const out=new Float32Array(Math.ceil(p.length*rate));let low=0,mid=0,phase=0;
  let rng=seed|0;const random=()=>{rng^=rng<<13;rng^=rng>>>17;rng^=rng<<5;return (rng>>>0)/2147483648-1;};
  for(let i=0;i<out.length;i++){
    const t=i/rate,n=random();low+=.045*(n-low);mid+=.42*(n-mid);
    phase+=Math.PI*2*(p.body+130*Math.exp(-t/.012))/rate;
    if(gun==='flesh-hit'||gun==='metal-hit'){
      const envelope=Math.min(1,t/.001)*Math.exp(-t/(gun==='flesh-hit'?.037:.045))*Math.min(1,(p.length-t)/.015);
      const signal=gun==='flesh-hit'?low*5+mid*.8+Math.sin(phase)*.65:Math.sin(t*2*Math.PI*1700)*.45+Math.sin(t*2*Math.PI*2831)*.27+n*Math.exp(-t/.005)*.55;
      out[i]=Math.tanh(signal)*.65*envelope;continue;
    }
    const crack=(n-mid*.7)*Math.exp(-t/p.crack)*1.15;
    const body=(Math.sin(phase)*.42+low*3.2)*Math.exp(-t/p.decay);
    const tail=low*1.1*Math.exp(-t/p.tail)*(1-Math.exp(-t/.012));
    const dt=t-p.action,action=dt>0?(n*.19+Math.sin(dt*2*Math.PI*1800)*.065)*Math.exp(-dt/.011):0;
    const fade=Math.min(1,t/.0007)*Math.min(1,(p.length-t)/.035);
    out[i]=Math.tanh((crack+body+tail+action)*1.4)*.9*fade;
  }
  return out;
}
