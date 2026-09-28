import type {World,Vec2} from '../shared/model';
export type FoleySound='step-concrete'|'step-grass'|'step-metal'|'reload-pistol'|'reload-ar'|'reload-shotgun'|'equip'|'grenade-throw'|'door';
export type FoleyCue={weapon:FoleySound;volume:number;pan:number;delay:number;id:number};
export class FoleyQueue{
  private previous=new Map<string,{pos:Vec2;distance:number;reload:number;weapon:string}>();
  private doors=new Map<string,boolean>();
  private grenades:number|undefined;
  private id=0;
  reset():void{this.previous.clear();this.doors.clear();this.grenades=undefined;this.id=0;}
  take(w:World):FoleyCue[]{
    const cues:FoleyCue[]=[];
    const add=(weapon:FoleySound,pos:Vec2,volume:number,range=450)=>{
      const dx=pos.x-w.player.pos.x,d=Math.hypot(dx,pos.y-w.player.pos.y);
      if(d<range)cues.push({weapon,volume:volume*Math.pow(1-d/range,1.6),pan:Math.max(-.85,Math.min(.85,dx/480)),delay:0,id:this.id++});
    };
    for(const a of [w.player,...w.enemies.map(e=>e.actor)]){
      const prev=this.previous.get(a.id),distance=prev?Math.hypot(a.pos.x-prev.pos.x,a.pos.y-prev.pos.y):0;
      let stride=(prev?.distance??0)+(distance<100?distance:0);
      if(prev&&a.hp>0){
        if(a.reloadRemaining>0&&prev.reload<=0&&a.weapon!=='none'&&a.weapon!=='railgun')add(`reload-${a.weapon}`,a.pos,.55);
        if(a.kind==='player'&&a.weapon!==prev.weapon)add('equip',a.pos,.35);
        const step=a.kind==='dog'?32:48;
        if(distance>0&&stride>=step){
          const hard=(a.pos.y>=432&&a.pos.y<=768)||w.map.buildings.some(b=>a.pos.x>b.x&&a.pos.x<b.x+b.w&&a.pos.y>b.y&&a.pos.y<b.y+b.h);
          add((a.kind==='robot'||a.kind==='spider')?'step-metal':hard?'step-concrete':'step-grass',a.pos,a.kind==='dog'?.14:.24,280);stride%=step;
        }
      }
      this.previous.set(a.id,{pos:{...a.pos},distance:stride,reload:a.reloadRemaining,weapon:a.weapon});
    }
    if(this.grenades!==undefined&&w.grenadeCount<this.grenades)add('grenade-throw',w.player.pos,.55);
    this.grenades=w.grenadeCount;
    for(const d of w.map.doors){if(this.doors.has(d.id)&&this.doors.get(d.id)!==d.open)add('door',d,.55);this.doors.set(d.id,d.open);}
    return cues;
  }
}
