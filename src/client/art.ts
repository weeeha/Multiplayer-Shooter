import type Phaser from 'phaser';
import type {MapData,Building} from '../shared/model';
import {spriteSource} from './Sprites';

function material(scene:Phaser.Scene,c:CanvasRenderingContext2D,index:number,x:number,y:number,w:number,h:number,size=240):void {
  const source=scene.textures.get('surfaces').getSourceImage() as HTMLImageElement;
  const half=source.width/2,sx=(index%2)*half,sy=Math.floor(index/2)*half;
  c.save();c.fillStyle=['#303a40','#6b7578','#49595a','#46545f'][index];c.fillRect(x,y,w,h);c.globalAlpha=index===0?.52:.8;c.beginPath();c.rect(x,y,w,h);c.clip();
  for(let yy=y;yy<y+h;yy+=size)for(let xx=x;xx<x+w;xx+=size)c.drawImage(source,sx,sy,half,half,xx,yy,size,size);
  c.restore();
}
function prop(scene:Phaser.Scene,c:CanvasRenderingContext2D,frame:string,x:number,y:number,w:number,h:number,mirror=false):void {
  const f=spriteSource(scene,'props',frame);c.save();c.filter='saturate(.6)';
  if(mirror){c.translate(x+w,y);c.scale(-1,1);c.drawImage(f.image,f.x,f.y,f.w,f.h,0,0,w,h);}
  else c.drawImage(f.image,f.x,f.y,f.w,f.h,x,y,w,h);
  c.restore();
}
export function roofTexture(scene:Phaser.Scene,b:Building):string {
  const key=`roof-${b.id}`;if(scene.textures.exists(key))return key;
  const texture=scene.textures.createCanvas(key,b.w+18,b.h+30)!,c=texture.context;
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  c.fillStyle='#080e12a0';c.fillRect(10,14,b.w+8,b.h+14);
  c.fillStyle='#687378';c.fillRect(0,0,b.w,b.h+12);
  material(scene,c,3,8,8,b.w-16,b.h-16,190);
  c.fillStyle='#27343c';c.fillRect(0,b.h-8,b.w,22);
  c.fillStyle='#899193';c.fillRect(0,0,b.w,5);c.fillRect(0,0,6,b.h);c.fillRect(b.w-6,0,6,b.h);
  c.fillStyle='#3b464a';for(let x=0;x<b.w;x+=64){c.fillRect(x,0,2,6);c.fillRect(x,b.h-8,2,22);}
  c.strokeStyle='#202d31';c.lineWidth=3;c.strokeRect(40,34,111,92);
  prop(scene,c,'1-1',42,22,104,91);prop(scene,c,'2-1',b.w-89,7,74,30);
  c.fillStyle='#313d41';c.fillRect(b.w-100,60,67,95);
  c.strokeStyle='#6c7a7d';c.lineWidth=2;c.strokeRect(b.w-100,60,67,95);
  for(let y=67;y<145;y+=7){c.fillStyle='#202d32';c.fillRect(b.w-93,y,53,3);}
  c.fillStyle='#af673d';c.fillRect(16,b.h-2,56,8);
  c.fillStyle='#c4c9bc';c.font='bold 15px monospace';c.fillText(b.label,30,b.h-37);
  c.fillStyle='#859599';c.font='8px monospace';c.fillText('RESTRICTED / UTILITY SERVICES',30,b.h-23);
  texture.refresh();return key;
}
export function terrainTexture(scene:Phaser.Scene,map:MapData):string {
  const key='field-terrain';if(scene.textures.exists(key))return key;
  const texture=scene.textures.createCanvas(key,1600,1280)!,c=texture.context;
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  let seed=713;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  material(scene,c,0,0,0,1600,1280,310);
  c.fillStyle='#283c3690';c.fillRect(0,0,1600,432);c.fillRect(0,752,1600,528);
  material(scene,c,0,70,450,1430,284,250);
  material(scene,c,1,70,414,1430,36,160);material(scene,c,1,70,734,1430,36,160);
  c.fillStyle='#909797';c.fillRect(70,444,1430,4);c.fillRect(70,734,1430,3);
  c.fillStyle='#1c2b30';c.fillRect(70,448,1430,3);c.fillRect(70,767,1430,3);
  for(let x=70;x<1500;x+=50){c.fillStyle='#344349';c.fillRect(x,444,2,6);c.fillRect(x,734,2,4);}
  c.globalAlpha=.7;c.fillStyle='#b9ad78';for(let x=100;x<1500;x+=100)c.fillRect(x,586,48,3);c.globalAlpha=1;
  c.strokeStyle='#a7ac9980';c.lineWidth=2;for(let x=155;x<1490;x+=260){c.beginPath();c.moveTo(x,500);c.lineTo(x,470);c.lineTo(x+64,470);c.lineTo(x+64,500);c.stroke();}
  // Low verge dressing is decorative; no solid props are invented on walkable routes.
  for(let i=0;i<160;i++){
    const x=random()*1570,y=i%2===0?395+random()*17:770+random()*25;
    if(x>475&&x<585)continue;
    prop(scene,c,i%4===0?'2-0':'2-1',x,y,34+random()*48,14+random()*20,random()>.5);
  }
  for(let i=0;i<125;i++){
    const x=random()*1560,y=random()*1240;
    if(x>60&&x<1510&&y>380&&y<820)continue;
    if(map.buildings.some(b=>x>b.x-15&&x<b.x+b.w&&y>b.y-15&&y<b.y+b.h))continue;
    prop(scene,c,i%7===0?'2-0':'2-1',x,y,40+random()*38,17+random()*15,random()>.5);
  }
  // Larger hand-placed thickets break up the empty field and read as bushes at gameplay scale.
  const thickets:[number,number,number,boolean][]=[
    [88,76,1.05,true],[185,262,.9,false],[795,92,1.1,false],[965,300,.92,true],[1190,110,1.08,false],[1430,286,.92,true],
    [92,916,.95,false],[188,1130,1.08,true],[790,942,1.1,true],[986,1150,.9,false],[1210,902,1.05,false],[1432,1102,1,true],
    [272,198,.78,false],[754,318,.82,true],[272,866,.8,true],[752,1000,.78,false]
  ];
  for(const [x,y,scale,rubble] of thickets){
    if(rubble)prop(scene,c,'2-0',x+12*scale,y-4*scale,52*scale,24*scale);
    prop(scene,c,'2-1',x,y,82*scale,34*scale);
    prop(scene,c,'2-1',x-26*scale,y+14*scale,54*scale,22*scale,true);
    prop(scene,c,'2-1',x+58*scale,y+13*scale,48*scale,20*scale);
  }
  // Drains and maintenance paint are flat ground marks.
  for(const [x,y] of [[470,702],[970,483],[1260,702]]){
    c.fillStyle='#17242a';c.fillRect(x,y,47,16);c.strokeStyle='#647277';c.lineWidth=2;c.strokeRect(x,y,47,16);
    for(let xx=x+4;xx<x+45;xx+=6){c.fillStyle='#46585e';c.fillRect(xx,y+2,2,12);}
  }
  for(const b of map.buildings){
    material(scene,c,2,b.x+16,b.y+16,b.w-32,b.h-32,208);
    c.fillStyle='#16252c55';c.fillRect(b.x+16,b.y+16,b.w-32,15);
    c.fillStyle='#a8b4b0';c.font='bold 13px monospace';c.fillText(b.label,b.x+42,b.y+78);
    // Painted floor service bays leave the room collision unchanged.
    c.strokeStyle='#b1855360';c.lineWidth=2;c.strokeRect(b.x+38,b.y+100,105,62);
    c.fillStyle='#586e7040';c.fillRect(b.x+39,b.y+101,103,60);
  }
  for(const b of map.blockers){
    if(b.id.startsWith('edge'))continue;
    if(b.id.startsWith('car')){
      c.fillStyle='#071116b0';c.beginPath();c.ellipse(b.x+b.w/2+4,b.y+b.h/2+10,b.w/2+5,b.h/2,0,0,Math.PI*2);c.fill();
      prop(scene,c,b.id==='car-a'?'0-0':'0-1',b.x-3,b.y-9,b.w+6,b.h+17);
    }else{
      material(scene,c,1,b.x,b.y,b.w,b.h,95);
      c.fillStyle=b.id.includes('window')?'#2e5666':'#33454e';c.fillRect(b.x,b.y+b.h-5,b.w,5);
      c.fillStyle='#a0adae';c.fillRect(b.x,b.y,b.w,2);
      if(b.w>100){
        c.fillStyle='#253c46';for(let x=b.x+18;x<b.x+b.w-30;x+=74){c.fillRect(x,b.y+4,28,7);c.fillStyle='#7c999f';c.fillRect(x+1,b.y+4,26,1);c.fillStyle='#253c46';}
      }
      if(b.id.includes('window')){c.fillStyle='#b3c8cb';for(let y=b.y+2;y<b.y+b.h;y+=12)c.fillRect(b.x+2,y,b.w-4,2);}
    }
  }
  // Wall-mounted electrical boxes occupy existing wall strips.
  for(const b of map.buildings){
    prop(scene,c,'1-0',b.x+104,b.y-18,25,36);
    prop(scene,c,'1-0',b.x+b.w-139,b.y-17,23,34,true);
    prop(scene,c,'2-0',b.x-38,b.y+b.h-62,48,24,b.id==='north');
  }
  c.fillStyle='#ad714d';c.font='bold 11px monospace';c.fillText('RELAY ACCESS  →',130,405);
  c.fillStyle='#94a0a0';c.font='10px monospace';c.fillText('SERVICE ROAD / 04',980,725);
  texture.refresh();return key;
}
