import type Phaser from 'phaser';
import type {MapData} from '../shared/model';

// Original deterministic placeholder artwork. All solid props come from map collision data.
export function terrainTexture(scene:Phaser.Scene,map:MapData):string {
  const key='field-terrain';
  if(scene.textures.exists(key)) return key;
  const texture=scene.textures.createCanvas(key,1600,1280)!;
  const c=texture.context;
  let seed=713;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  c.fillStyle='#34382c';c.fillRect(0,0,1600,1280);
  for(let i=0;i<15000;i++) {
    const x=Math.floor(random()*1600),y=Math.floor(random()*1280);
    c.fillStyle=['#3a3c2d','#2d3329','#454431','#373c30'][i%4];
    c.fillRect(x,y,1+Math.floor(random()*5),1+Math.floor(random()*3));
  }
  c.fillStyle='#262e2c';c.fillRect(70,450,1430,284);
  c.fillStyle='#43473a';c.fillRect(70,432,1430,18);c.fillRect(70,734,1430,18);
  c.fillStyle='#5b5d49';c.fillRect(70,432,1430,2);c.fillRect(70,734,1430,2);
  for(let x=80;x<1490;x+=48){c.fillStyle='#282f29';c.fillRect(x,433,2,16);c.fillRect(x,735,2,16);}
  c.fillStyle='#857d49';for(let x=100;x<1500;x+=100)c.fillRect(x,586,48,3);
  c.fillStyle='#61604b';for(let x=155;x<1490;x+=260){c.fillRect(x,470,52,2);c.fillRect(x,470,2,31);c.fillRect(x+52,470,2,31);}
  for(let i=0;i<90;i++) {
    const x=70+random()*1420,y=450+random()*280;
    c.strokeStyle='#161f1b';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x+10,y+4);c.lineTo(x+16,y-6);c.lineTo(x+36,y+5);c.stroke();
  }
  // Sparse ground clutter gives texture without pretending to be physical cover.
  for(let i=0;i<500;i++) {
    const x=random()*1550,y=random()*1250;
    c.fillStyle=i%3===0?'#69674d':'#444b37';c.fillRect(x,y,random()*5+2,random()*3+1);
  }
  for(const b of map.buildings) {
    c.fillStyle='#1b251f';c.fillRect(b.x+15,b.y+16,b.w-30,b.h-32);
    for(let x=b.x+16;x<b.x+b.w-16;x+=32)for(let y=b.y+16;y<b.y+b.h-16;y+=32){
      c.fillStyle=(Math.floor(x/32)+Math.floor(y/32))%2?'#454b3e':'#3c4338';c.fillRect(x,y,30,30);
    }
    c.fillStyle='#636957';c.font='bold 13px monospace';c.fillText(b.label,b.x+55,b.y+65);
    c.strokeStyle='#697053';c.lineWidth=2;c.strokeRect(b.x+35,b.y+90,90,60);
    c.fillStyle='#303b30';c.fillRect(b.x+36,b.y+91,88,58);
    for(let i=0;i<6;i++){c.fillStyle='#5a624c';c.fillRect(b.x+42+i*13,b.y+96,7,44);}
    c.fillStyle='#766b4d';c.fillRect(b.x+280,b.y+205,45,28);
    c.strokeStyle='#292f27';c.strokeRect(b.x+280,b.y+205,45,28);
  }
  for(const b of map.blockers) {
    if(b.id.startsWith('edge'))continue;
    if(b.id.startsWith('car')) {
      c.fillStyle='#121a16';c.fillRect(b.x+7,b.y+8,b.w+2,b.h+7);
      c.fillStyle='#101814';for(const x of [b.x+10,b.x+72]){c.fillRect(x,b.y-3,16,8);c.fillRect(x,b.y+b.h-3,16,8);}
      c.fillStyle=b.id==='car-a'?'#666650':'#6d493b';c.fillRect(b.x,b.y,b.w,b.h);
      c.fillStyle='#303a32';c.fillRect(b.x+26,b.y+5,40,b.h-10);
      c.fillStyle='#829084';c.fillRect(b.x+28,b.y+7,12,b.h-14);
      c.fillStyle=b.id==='car-a'?'#8a8465':'#946348';c.fillRect(b.x+42,b.y+6,22,b.h-12);
      c.fillStyle='#383f32';c.fillRect(b.x+4,b.y+7,17,b.h-14);
      c.fillStyle='#9e8555';c.fillRect(b.x+96,b.y+5,4,8);c.fillRect(b.x+96,b.y+35,4,8);
      c.fillStyle='#2e3429';c.fillRect(b.x,b.y+b.h-5,b.w,5);
      c.fillStyle='#a19566';for(let i=0;i<8;i++)c.fillRect(b.x+random()*b.w,b.y+random()*b.h,4,2);
    }else {
      c.fillStyle=b.id.includes('window')?'#70847b':'#69705b';c.fillRect(b.x,b.y,b.w,b.h);
      c.fillStyle='#303b2e';c.fillRect(b.x,b.y+b.h-5,b.w,5);
      c.fillStyle='#8a8e70';c.fillRect(b.x,b.y,b.w,2);
    }
  }
  c.font='11px monospace';c.fillStyle='#7d7958';c.fillText('RELAY ACCESS  →',130,420);c.fillText('SERVICE ROAD',960,725);
  texture.refresh();return key;
}
