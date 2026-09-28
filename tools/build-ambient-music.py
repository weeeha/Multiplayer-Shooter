"""Render an original, seamless 48-second ambient loop (no external samples)."""
from pathlib import Path
import math, struct, wave, hashlib, json
RATE=24000; LENGTH=48; TAU=math.tau
out=Path('public/audio/music');out.mkdir(parents=True,exist_ok=True)
def note(midi):return round(440*2**((midi-69)/12)*LENGTH)/LENGTH
chords=[(38,45,53,57),(34,41,50,53),(41,48,53,57),(36,43,50,55)]
frames=bytearray();peak=0;power=0
for i in range(RATE*LENGTH):
 t=i/RATE;left=right=0
 # Warm slow pads with overlapping chord changes; tails wrap through the seam.
 for ci,chord in enumerate(chords):
  age=(t-ci*12)%LENGTH
  if age>=16:continue
  envelope=min(1,age/3,(16-age)/4);envelope=math.sin(envelope*math.pi/2)**2
  for ni,midi in enumerate(chord):
   f=note(midi);s=math.sin(TAU*f*t+.23*ni)+.22*math.sin(TAU*f*2*t+.7)
   shimmer=.82+.18*math.sin(TAU*(ni+1)*t/LENGTH+ci)
   pan=math.sin(ni*2.1+ci)*.45;v=s*envelope*shimmer*.045
   left+=v*(1-pan);right+=v*(1+pan)
 # Low machinery hum and a soft breathing pulse, deliberately unlike gunshots.
 hum=(math.sin(TAU*note(26)*t)+.22*math.sin(TAU*note(38)*t))*.025
 pulse=math.exp(-((t%3)-1.5)**2/.35)*math.sin(TAU*note(38)*t)*.025
 left+=hum+pulse;right+=hum+pulse
 # Sparse suspended bell notes, smooth attack and long decay, wrapped tails.
 for n,(start,midi) in enumerate([(2,74),(10,69),(19,65),(29,72),(37,69),(44,67)]):
  age=(t-start)%LENGTH
  if age>8:continue
  f=note(midi);v=(1-math.exp(-age*5))*math.exp(-age/.95)*(.5+.5*math.cos(math.pi*age/8))
  bell=(math.sin(TAU*f*age)+.18*math.sin(TAU*f*2.003*age))*.035*v
  left+=bell*(.75 if n%2 else 1);right+=bell*(1 if n%2 else .75)
 for value in (left,right):
  peak=max(peak,abs(value));power+=value*value
  frames.extend(struct.pack('<h',round(max(-1,min(1,value))*32767)))
path=out/'cold-relay-ambient.wav'
with wave.open(str(path),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(frames)
(out/'provenance.json').write_text(json.dumps({'title':'Cold Relay — After the Signal','origin':'Original deterministic synthesis; no external samples','recipe':'tools/build-ambient-music.py','seconds':LENGTH,'sampleRate':RATE,'channels':2,'peak':peak,'rms':math.sqrt(power/(RATE*LENGTH*2)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()},indent=2)+'\n')
print(path, 'peak',round(peak,4),'RMS',round(math.sqrt(power/(RATE*LENGTH*2)),4))
