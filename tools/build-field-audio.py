from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess,json,hashlib,math,random,struct,wave
out=Path('public/audio/field');root=Path('output/audio-sources');recipes=[]
def add(cue,source,start=0,duration=None,filters=''):
 recipes.append(dict(cue=cue,source=source,start=start,duration=duration,filters=filters))
for start in [1.395,6.43,10.65]:add('pistol','firearms/Prepared SFX Library/Walther PPQ/X_39P.wav',start,.8)
for start in [.69,5.635]:add('ar','firearms/Prepared SFX Library/AR-15/D_32P.wav',start,.7)
for start in [1.685,4.95]:add('shotgun','firearms/Prepared SFX Library/Mossberg/N_30P.wav',start,1.1)
add('dog-bite','snarls/dog/dog-snarl.flac',0,.42)
add('dog-bite','snarls/dog/dog-growl.flac',0,.42)
add('dog-death','dogs/Dog/Sad Dog 1.wav',.94,.72,'afftdn=nf=-25')
add('dog-death','dogs/Dog/Sad Dog 1.wav',1.79,.94,'afftdn=nf=-25')
for start,duration in [(.20,2.85),(3.63,2.75),(6.60,2.4)]:add('zombie-death','zombie.ogg',start,duration)
for start,duration in [(.48,1.48),(17.42,1.25),(33.52,1.4)]:add('scavenger-death','human.wav',start,duration)
add('explosion','explosion.mp3',0,2.7)
for gun in ['pistol','ar','shotgun']:add('reload-'+gun,gun+'-reload.wav',0,None)
add('equip','pistol-reload.wav',.15,.24)
add('grenade-throw','shotgun-reload.wav',0,.32)
for i in range(3):
 for cue,name in [('flesh-hit','impactSoft_heavy'),('metal-hit','impactMetal_light'),('surface-hit','impactGeneric_light'),('step-concrete','footstep_concrete'),('step-grass','footstep_grass'),('step-metal','impactMetal_light'),('door','impactWood_medium'),('robot-death','impactMetal_heavy')]:
  add(cue,f'impact/Audio/{name}_{i:03}.ogg')

rail_shots=[
 dict(cue='rail-player-shot',source='firearms/Prepared SFX Library/AR-15/D_32P.wav',start=.69,duration=1.1,profile='player',variant=0),
 dict(cue='rail-player-shot',source='firearms/Prepared SFX Library/AR-15/D_24P.wav',start=.69,duration=1.1,profile='player',variant=1),
 dict(cue='rail-spider-shot',source='firearms/Prepared SFX Library/Mossberg/N_30P.wav',start=1.685,duration=1.25,profile='spider',variant=0),
 dict(cue='rail-spider-shot',source='firearms/Prepared SFX Library/Mossberg/N_26P.wav',start=1.685,duration=1.25,profile='spider',variant=1),
]

def rail_layer(path,profile,variant):
 rate=24000;charge=profile=='charge';spider=profile=='spider'
 duration=1.16 if charge else (1.62 if spider else 1.28)
 rng=random.Random(7117+variant*409+(97 if spider else 0));samples=[];body_phase=coil_phase=hum_phase=whine_phase=0.;brown=0.
 for i in range(round(rate*duration)):
  t=i/rate;white=rng.uniform(-1,1);brown=.985*brown+.015*white
  if charge:
   u=t/duration;ramp=min(1,t/.055);end=min(1,(duration-t)/.025);power=ramp*end*(.42+.58*u*u)
   body_hz=54+172*u*u;whine_hz=360+1160*u*u*u
   hum_phase+=2*math.pi*body_hz/rate;whine_phase+=2*math.pi*whine_hz/rate
   pulse=max(0,math.sin(2*math.pi*(5.2*t+5.8*t*u)))**10
   crackle=white*(pulse*.13+.018*u*u)
   value=power*(.36*math.sin(hum_phase)+.13*math.sin(2*hum_phase)+.18*math.sin(whine_phase)+crackle)
  else:
   body_hz=(44 if spider else 58)+(116 if spider else 142)*math.exp(-t/.11)
   coil_hz=(430 if spider else 560)+(2050 if spider else 2500)*math.exp(-t/.075)
   body_phase+=2*math.pi*body_hz/rate;coil_phase+=2*math.pi*coil_hz/rate
   crack=white*math.exp(-t/(.024 if spider else .017))
   body=math.sin(body_phase)*math.exp(-t/(.34 if spider else .24))
   coil=math.sin(coil_phase)*math.exp(-t/(.20 if spider else .15))
   after_t=max(0,t-.036);after=(math.sin(2*math.pi*(73 if spider else 96)*after_t)*math.exp(-after_t/.24)) if t>.036 else 0
   tail=(brown*2.8+math.sin(2*math.pi*(48 if spider else 66)*t))*math.exp(-t/(.72 if spider else .52))
   value=(.72*crack+.78*body+.28*coil+.30*after+.16*tail)*(1-math.exp(-t/.0015))
  samples.append(math.tanh(value*1.35))
 peak=max(abs(v) for v in samples);scale=.82/peak
 with wave.open(str(path),'wb') as target:
  target.setparams((1,2,rate,len(samples),'NONE','not compressed'))
  target.writeframes(b''.join(struct.pack('<h',round(max(-1,min(1,v*scale))*32767)) for v in samples))

manifest={};credits=[]
for recipe in recipes:
 cue=recipe['cue'];index=len(manifest.get(cue,[]));target=out/f'{cue}-{index}.wav';source=root/recipe['source']
 args=['ffmpeg','-v','error','-y','-ss',str(recipe['start']),'-i',str(source)]
 if recipe['duration']:args+=['-t',str(recipe['duration'])]
 filters='highpass=f=65,lowpass=f=11000'
 if recipe['filters']:filters+=','+recipe['filters']
 filters+=',silenceremove=start_periods=1:start_duration=0:start_threshold=-45dB,loudnorm=I=-20:TP=-3:LRA=7,afade=t=in:d=0.003,areverse,afade=t=in:d=0.06,areverse'
 subprocess.run(args+['-af',filters,'-ac','1','-ar','24000','-c:a','pcm_s16le',str(target)],check=True)
 manifest.setdefault(cue,[]).append('/audio/field/'+target.name)
 credits.append({**recipe,'file':target.name,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})

with TemporaryDirectory() as temp:
 temp=Path(temp)
 for variant in range(2):
  layer=temp/f'rail-charge-{variant}.wav';rail_layer(layer,'charge',variant);target=out/f'rail-charge-{variant}.wav'
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(layer),'-af','highpass=f=35,lowpass=f=11500,loudnorm=I=-19:TP=-3:LRA=6,afade=t=in:d=0.008,areverse,afade=t=in:d=0.025,areverse','-ac','1','-ar','24000','-c:a','pcm_s16le',str(target)],check=True)
  manifest.setdefault('rail-charge',[]).append('/audio/field/'+target.name)
  credits.append(dict(cue='rail-charge',source='Original deterministic synthesis',start=0,duration=1.16,filters='rising dual oscillator, accelerating pulse and electrical crackle',file=target.name,sourceSha256=hashlib.sha256(layer.read_bytes()).hexdigest(),sha256=hashlib.sha256(target.read_bytes()).hexdigest()))
 for recipe in rail_shots:
  cue=recipe['cue'];index=len(manifest.get(cue,[]));target=out/f'{cue}-{index}.wav';source=root/recipe['source'];layer=temp/f'{cue}-{index}-layer.wav';rail_layer(layer,recipe['profile'],recipe['variant'])
  pitch=19000 if recipe['profile']=='spider' else 21600;report_gain=.76 if recipe['profile']=='spider' else .68;integrated=-16 if recipe['profile']=='spider' else -17
  filters=f'[0:a]atrim=0:{recipe["duration"]},asetpts=PTS-STARTPTS,highpass=f=48,lowpass=f=11000,aresample=24000,asetrate={pitch},aresample=24000,volume={report_gain}[report];[1:a]volume=0.92[synth];[report][synth]amix=inputs=2:duration=longest:normalize=0,highpass=f=30,lowpass=f=11500,loudnorm=I={integrated}:TP=-2:LRA=8,afade=t=in:d=0.002,areverse,afade=t=in:d=0.08,areverse[out]'
  subprocess.run(['ffmpeg','-v','error','-y','-ss',str(recipe['start']),'-i',str(source),'-i',str(layer),'-filter_complex',filters,'-map','[out]','-ac','1','-ar','24000','-c:a','pcm_s16le',str(target)],check=True)
  manifest.setdefault(cue,[]).append('/audio/field/'+target.name)
  credits.append({**recipe,'file':target.name,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'synthLayerSha256':hashlib.sha256(layer.read_bytes()).hexdigest(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(out/'provenance.json').write_text(json.dumps(credits,indent=2)+'\n')
print(len(credits),'samples',sum(p.stat().st_size for p in out.glob('*.wav')),'bytes')
