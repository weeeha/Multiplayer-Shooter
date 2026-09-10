import type {World} from '../shared/model';
import {distance} from '../shared/geometry';
export class FieldSound {
  private context:AudioContext|null=null;
  private playerAmmo=12;
  private robotAmmo=12;
  unlock():void {
    this.context??=new AudioContext();
    void this.context.resume();this.playerAmmo=12;this.robotAmmo=12;
  }
  update(w:World):void {
    if(w.player.ammo<this.playerAmmo)this.shot(.055,240);
    if(w.robot.ammo<this.robotAmmo){const gain=Math.max(0,1-distance(w.player.pos,w.robot.pos)/700);if(gain>0)this.shot(.045*gain,135);}
    this.playerAmmo=w.player.ammo;this.robotAmmo=w.robot.ammo;
  }
  private shot(volume:number,frequency:number):void {
    const c=this.context;if(!c||c.state!=='running')return;
    const o=c.createOscillator(),gain=c.createGain();o.type='sawtooth';
    o.frequency.setValueAtTime(frequency,c.currentTime);o.frequency.exponentialRampToValueAtTime(45,c.currentTime+.075);
    gain.gain.setValueAtTime(volume,c.currentTime);gain.gain.exponentialRampToValueAtTime(.001,c.currentTime+.085);
    o.connect(gain);gain.connect(c.destination);o.start();o.stop(c.currentTime+.09);
    o.onended=()=>{o.disconnect();gain.disconnect();};
  }
  destroy():void {void this.context?.close();}
}
