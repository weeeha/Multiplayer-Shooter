export const CREATURE_SOUNDS=['dog-bite','dog-death','zombie-death','scavenger-death','robot-death'] as const;
export type CreatureSound=typeof CREATURE_SOUNDS[number];

// Original synthesized creature voices: harmonic vocal excitation through
// resonant formants, with breath/noise and a separate jaw/contact transient.
export function synthesizeCreature(sound:CreatureSound,rate:number,seed:number):Float32Array<ArrayBuffer>{
  const duration={'dog-bite':.42,'dog-death':.72,'zombie-death':1.15,'scavenger-death':.64,'robot-death':1.05}[sound];
  const out=new Float32Array(Math.ceil(duration*rate));let phase=0,low=0,rng=seed|0;
  const formants=sound.startsWith('dog')?[650,1450,2700]:sound==='zombie-death'?[340,850,2100]:[520,1250,2400];
  const resonators=formants.map(f=>({a:2*Math.exp(-Math.PI*150/rate)*Math.cos(2*Math.PI*f/rate),b:Math.exp(-2*Math.PI*150/rate),y1:0,y2:0}));
  for(let i=0;i<out.length;i++){
    const t=i/rate,u=t/duration;rng^=rng<<13;rng^=rng>>>17;rng^=rng<<5;const noise=(rng>>>0)/2147483648-1;low+=.12*(noise-low);
    const envelope=Math.min(1,t/.014)*Math.pow(1-u,1.4)*Math.min(1,(duration-t)/.04);
    if(sound==='robot-death'){
      phase+=2*Math.PI*(760*Math.pow(1-u,2)+45)/rate;
      const stutter=.35+.65*Math.max(0,Math.sin(t*2*Math.PI*(17-12*u)));
      out[i]=Math.tanh((Math.sin(phase)+Math.sin(phase*1.49)*.5)*stutter*.7+low*2*Math.exp(-t/.15))*.7*envelope;continue;
    }
    const pitch=sound==='dog-death'?390-250*u:sound==='dog-bite'?120+65*Math.sin(Math.PI*u):sound==='zombie-death'?72-24*u:135-65*u;
    phase+=2*Math.PI*pitch*(1+.04*Math.sin(t*2*Math.PI*37))/rate;
    const pulse=(Math.sin(phase)+.55*Math.sin(phase*2)+.3*Math.sin(phase*3))*(.8+.2*Math.sin(phase*.49));
    const excitation=pulse*.3+noise*(sound==='zombie-death'?.2:.08);
    let voice=0;for(const [j,r] of resonators.entries()){const y=excitation+r.a*r.y1-r.b*r.y2;r.y2=r.y1;r.y1=y;voice+=y*.022/(j+1);}
    let signal=voice+low*.65;
    if(sound==='dog-bite'){
      const snap=t-.16;
      if(snap>=0)signal+=(noise*.9+Math.sin(snap*2*Math.PI*180)*.65)*Math.exp(-snap/.024);
    }
    out[i]=Math.tanh(signal*2.8)*.74*envelope;
  }
  return out;
}
