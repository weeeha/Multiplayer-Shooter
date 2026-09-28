import Phaser from 'phaser';
import {LocalSession} from './LocalSession';
import {GameInput} from './input';
import {WorldView} from './WorldView';
import {Hud} from './Hud';
import {installTestHooks} from './testHooks';
import {preloadArt,prepareArt} from './Sprites';
import {FieldSound} from './Sound';

export class PlayScene extends Phaser.Scene {
  private session=new LocalSession();
  private controls!:GameInput;
  private view!:WorldView;
  private hud!:Hud;
  private soundFx=new FieldSound();
  private testMode=new URLSearchParams(location.search).get('test')==='1';
  private focused=true;
  constructor(){super('field');}
  preload():void {preloadArt(this);}
  create():void {
    prepareArt(this);
    this.cameras.main.setBounds(0,0,1600,1280);
    this.view=new WorldView(this,this.session.world);
    this.controls=new GameInput(this);
    this.hud=new Hud(this.session,()=>{
      this.session.start();this.view.reset(this.session.world);this.controls.clear();this.focused=true;this.soundFx.unlock();
    },()=>{this.controls.clear();this.session.clearEdges();},()=>{
      const element=document.querySelector<HTMLElement>('#app')!;
      if(document.fullscreenElement)void document.exitFullscreen();else void element.requestFullscreen();
    });
    const onBlur=()=>{this.focused=false;this.controls.clear();this.session.clearEdges();};
    const onFocus=()=>{this.focused=true;this.controls.clear();};
    window.addEventListener('blur',onBlur);window.addEventListener('focus',onFocus);
    const visibility=()=>{if(document.hidden)onBlur();else onFocus();};
    document.addEventListener('visibilitychange',visibility);
    const click=()=>{this.focused=true;};this.game.canvas.addEventListener('pointerdown',click);
    const removeHooks=this.testMode?installTestHooks(this.session,ms=>{
      if(!this.hud.settings)this.advance(ms);
      this.present(1/60);
    },()=>this.view.visualState()):()=>{};
    this.events.once('shutdown',()=>{
      removeHooks();this.controls.destroy();this.hud.destroy();this.soundFx.destroy();
      window.removeEventListener('blur',onBlur);window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',visibility);this.game.canvas.removeEventListener('pointerdown',click);
    });
    this.present(1/60);
  }
  private advance(ms:number):void {
    const p=this.session.world.player;
    this.session.advance(ms,this.controls.read(p.pos,p.aim));this.soundFx.update(this.session.world);
  }
  private present(dt:number):void {
    const p=this.session.world.player;
    this.cameras.main.centerOn(p.pos.x,p.pos.y);
    this.view.render(this.session.world,this.hud.debug,dt);
    this.hud.update(!this.focused);
  }
  update(_time:number,delta:number):void {
    if(!this.controls)return;
    if(!this.testMode&&this.focused&&!this.hud.settings)this.advance(Math.min(delta,100));
    this.present(Math.min(delta/1000,.1));
  }
}
