import type Phaser from 'phaser';
import type {World,Vec2} from '../shared/model';
import {getBlockers} from '../shared/map';
import {canSee} from '../shared/visibility';
import {GRENADE} from '../shared/grenades';
import {T} from '../shared/tuning';

type Particle={origin?:Vec2;pos:Vec2;vx:number;vy:number;born:number;life:number;color:number;size:number;type:'spark'|'dust'|'case'|'chip'};
export class CombatEffects {
  private particles:Particle[]=[];
  private scars:{pos:Vec2;size:number;color:number;born:number}[]=[];
  private lastId=-1;
  private previous=new Map<string,Vec2>();
  reset():void {this.particles=[];this.scars=[];this.lastId=-1;this.previous.clear();}
  get count():number{return this.particles.length;}
  render(g:Phaser.GameObjects.Graphics,w:World):void {
    g.clear();const walls=getBlockers(w.map);
    const visible=(p:Vec2)=>{
      const dx=w.player.pos.x-p.x,dy=w.player.pos.y-p.y,n=Math.hypot(dx,dy)||1;
      return canSee(w.player.pos,{x:p.x+dx/n*.75,y:p.y+dy/n*.75},walls,T.sight);
    };
    const add=(p:Particle,origin:Vec2=p.pos)=>this.particles.push({...p,origin:{...origin}});
    for(const e of w.events){
      if(e.id<=this.lastId)continue;this.lastId=e.id;
      if(!visible(e.pos))continue;
      const rand=(i:number)=>{const x=Math.sin((e.id+1)*127.1+i*311.7)*43758.5453;return x-Math.floor(x);};
      const angle=Math.atan2(e.direction.y,e.direction.x);
      if(e.kind==='shot'){
        const x=e.pos.x+Math.cos(angle)*17,y=e.pos.y+Math.sin(angle)*17;
        add({pos:{x,y:y-T.visualAimHeight},vx:Math.cos(angle+1.5)*55,vy:Math.sin(angle+1.5)*55-22,born:e.time,life:1.1,color:0xceb27a,size:2,type:'case'},e.pos);
        add({pos:{x:e.pos.x+Math.cos(angle)*30,y:e.pos.y-T.visualAimHeight+Math.sin(angle)*30},vx:Math.cos(angle)*18,vy:-18,born:e.time,life:.38,color:0xa3aaa7,size:3,type:'dust'},e.pos);
      }else{
        const metal=e.material==='metal',blast=e.kind==='explosion',death=e.kind==='death'||blast,count=blast?50:death?18:metal?7:5;
        for(let i=0;i<count;i++){
          const theta=rand(i)*Math.PI*2,speed=25+rand(i+40)*(death?110:75);
          add({pos:{x:e.pos.x,y:e.pos.y-T.visualAimHeight*.75},vx:Math.cos(theta)*speed,vy:Math.sin(theta)*speed-20,born:e.time,life:.22+rand(i+80)*.45,color:blast?(i%3===0?0xffbe76:0x8e897b):metal?(i%3===0?0xecf8df:0x90d7e6):e.material==='flesh'?0x79514a:0xa0aba7,size:metal?1.5:2,type:metal?'spark':'chip'},e.pos);
        }
        add({pos:{x:e.pos.x,y:e.pos.y-8},vx:0,vy:-12,born:e.time,life:death?.9:.5,color:metal?0x607c84:0x8b9185,size:blast?26:death?9:5,type:'dust'},e.pos);
        this.scars.push({pos:{...e.pos},size:death?13:3,color:metal?0x16262e:0x403c37,born:e.time});
      }
    }
    for(const grenade of w.grenades){
      if(!visible(grenade.pos))continue;
      const f=Math.min(1,grenade.age/GRENADE.flight),height=Math.sin(f*Math.PI)*55;
      const {x,y}=grenade.pos;
      g.fillStyle(0x061014,.5).fillEllipse(x,y,10,5);
      g.lineStyle(1,0xd8a469,.6).strokeEllipse(x,y,15,7);
      g.fillStyle(0x18231e).fillCircle(x,y-height-3,5);
      g.fillStyle(0x8c9a68).fillCircle(x,y-height-4,3.5);
      g.fillStyle(Math.floor(grenade.age*10)%2?0xffb46a:0xa05235).fillCircle(x+2,y-height-8,2);
    }
    for(const e of w.events)if(e.kind==='explosion'&&visible(e.pos)){
      const age=w.time-e.time;
      if(age<.3){g.lineStyle(2,0xf4be80,(1-age/.3)*.7).strokeCircle(e.pos.x,e.pos.y,15+age*260);g.fillStyle(0xffd28e,Math.max(0,.55-age*3)).fillCircle(e.pos.x,e.pos.y,20+age*70);}
    }
    for(const a of [w.player,...w.enemies.map(e=>e.actor)]){
      const prev=this.previous.get(a.id);if(!prev){this.previous.set(a.id,{...a.pos});continue;}
      const d=Math.hypot(a.pos.x-prev.x,a.pos.y-prev.y);
      if(d>17){this.previous.set(a.id,{...a.pos});if(a.hp>0&&visible(a.pos))add({pos:{x:a.pos.x,y:a.pos.y+3},vx:0,vy:-3,born:w.time,life:.4,color:0x929b88,size:a.kind==='dog'?2:3,type:'dust'});}
    }
    this.scars=this.scars.filter(s=>w.time-s.born<25).slice(-70);
    for(const s of this.scars)if(visible(s.pos))g.fillStyle(s.color,.6).fillEllipse(s.pos.x,s.pos.y,s.size*1.8,s.size*.7);
    this.particles=this.particles.filter(p=>w.time-p.born<p.life).slice(-240);
    for(const p of this.particles){
      if(p.origin&&!visible(p.origin))continue;
      const age=Math.max(0,w.time-p.born),fade=1-age/p.life;
      const gravity=p.type==='case'?120:p.type==='chip'?90:0;
      const x=p.pos.x+p.vx*age,y=p.pos.y+p.vy*age+gravity*age*age;
      if(p.type==='dust')g.fillStyle(p.color,fade*.2).fillCircle(x,y,p.size+age*12);
      else if(p.type==='spark')g.lineStyle(p.size,p.color,fade).lineBetween(x,y,x-p.vx*.035,y-p.vy*.035);
      else if(p.type==='case')g.lineStyle(1.5,p.color,fade).lineBetween(x,y,x+Math.cos(age*18)*3,y+Math.sin(age*18)*3);
      else g.fillStyle(p.color,fade*.8).fillRect(x,y,p.size,p.size);
    }
  }
}
