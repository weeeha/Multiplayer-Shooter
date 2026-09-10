import type {LocalSession} from './LocalSession';
import {WEAPONS} from '../shared/tuning';
import {switchWeapon} from '../shared/combat';
import type {WeaponId} from '../shared/model';
import {nearbyDoors} from '../shared/map';
export class Hud {
  private root=document.querySelector<HTMLDivElement>('#interface')!;
  private lastMode='';
  private abort=new AbortController();
  private pointerInside=false;
  settings=false;
  debug=false;
  constructor(private session:LocalSession,private start:()=>void,private clear:()=>void,private fullscreen:()=>void) {
    this.root.innerHTML=`
      <div class="brand"><span class="brand-mark">╱╱</span><div>EXCLUSION<span>COMBAT FIELD TEST · 01</span></div></div>
      <div class="local-badge"><i></i> LOCAL PROTOTYPE</div>
      <section class="entry panel">
        <div class="eyebrow">ABANDONED RELAY STATION</div>
        <h1>Watch<br>your corners<span>.</span></h1>
        <p>Three shooters. A rabid dog. A zombie.<br>Pick your weapon. Use cover. Stay alive.</p>
        <button id="start-btn" class="primary">ENTER THE FIELD <span>↗</span></button>
        <div class="controls"><div><kbd>W A S D</kbd> Move</div><div><kbd>MOUSE</kbd> Aim & fire</div><div><kbd>1 2 3</kbd> Switch gun</div><div><kbd>R</kbd> Reload</div><div><kbd>E</kbd> Door</div><div><kbd>SPACE</kbd> Dash</div></div>
        <small>Movement & visibility test · No online play or looting yet</small>
      </section>
      <div class="playing-ui" hidden>
        <div class="mission"><span class="eyebrow">FIELD OBJECTIVE</span><strong>Locate the patrol. Survive contact.</strong><small>Shooters east / northeast · Creatures southeast →</small></div>
        <button class="settings-button" aria-label="Open field settings">⚙ <span>SETTINGS</span></button>
        <div class="vitals"><div class="health"><span>HEALTH</span><strong id="hp">100</strong><div class="health-track"><i id="health-fill"></i></div></div><div class="armor"><span>ARMOR</span><strong id="armor">50</strong><div class="health-track"><i id="armor-fill"></i></div></div><div class="ammo"><span>9MM PISTOL</span><strong><b id="ammo">12</b><em> / <b id="reserve">48</b></em></strong></div><div class="dash"><span>MOBILITY</span><strong id="dash-status">READY</strong><small>SPACE</small></div></div>
        <div class="weapon-rack" aria-label="Weapons">
          <button data-weapon="pistol" aria-label="Equip pistol"><kbd>1</kbd><svg viewBox="0 0 70 28"><path d="M10 6h42v8H30l-4 12H15l3-12h-8z"/></svg><span>PISTOL</span></button>
          <button data-weapon="ar" aria-label="Equip assault rifle"><kbd>2</kbd><svg viewBox="0 0 70 28"><path d="M3 10h17V7h28v3h18v4H45l-4 12h-9l3-12H23l-3 9h-7l2-9H3z"/></svg><span>AR</span></button>
          <button data-weapon="shotgun" aria-label="Equip shotgun"><kbd>3</kbd><svg viewBox="0 0 70 28"><path d="M2 14l16-6h49v5H31v4H20L7 25z"/></svg><span>SHOTGUN</span></button>
        </div>
        <div class="crosshair" hidden><svg viewBox="0 0 40 40"><path d="M20 3v9M20 28v9M3 20h9M28 20h9"/><circle cx="20" cy="20" r="2"/></svg></div>
        <div class="door-prompt" hidden><kbd>E</kbd><span></span></div>
        <div class="field-footer"><span>WASD move · Mouse aim / fire · R reload</span><span>THREE-QUARTER / 2D</span></div>
      </div>
      <section class="settings panel" hidden><div class="eyebrow">FIELD SETTINGS</div><h2>Adjust the test.</h2><label><span>Enable dash<small>Short burst · no invulnerability</small></span><input id="dash-toggle" type="checkbox" checked></label><label><span>Collision & sightlines<small>Show debug geometry</small></span><input id="debug-toggle" type="checkbox"></label><button id="fullscreen-btn">Fullscreen ↗</button><button id="restart-btn">Restart field test</button><button id="resume-btn" class="primary">RETURN TO FIELD →</button></section>
      <section class="death panel" hidden><div class="eyebrow">CONTACT LOST</div><h2>You went quiet.</h2><p>Use buildings and cars to break shooters’ sightlines. Keep your distance from the dog and zombie.</p><button id="retry-btn" class="primary">RE-ENTER THE FIELD ↗</button><small>Restart resets this local test.</small></section>
      <div class="paused" hidden>FIELD PAUSED <span>Click the field to return</span></div>`;
    const click=(id:string,fn:()=>void)=>this.root.querySelector<HTMLButtonElement>(id)!.addEventListener('click',e=>{fn();(e.currentTarget as HTMLButtonElement).blur();});
    for(const id of ['#start-btn','#restart-btn','#retry-btn']) click(id,()=>{this.settings=false;this.start();});
    click('.settings-button',()=>{this.settings=true;this.clear();});
    click('#resume-btn',()=>{this.settings=false;this.clear();});
    click('#fullscreen-btn',this.fullscreen);
    for(const button of this.root.querySelectorAll<HTMLButtonElement>('[data-weapon]'))button.addEventListener('click',()=>{
      if(this.session.mode==='playing'&&!this.settings)switchWeapon(this.session.world.player,button.dataset.weapon as WeaponId);
      this.clear();button.blur();
    });
    window.addEventListener('pointermove',e=>{
      const canvas=document.querySelector('canvas')!.getBoundingClientRect(),rect=this.root.getBoundingClientRect();
      this.pointerInside=e.clientX>=canvas.left&&e.clientX<=canvas.right&&e.clientY>=canvas.top&&e.clientY<=canvas.bottom&&!(e.target as HTMLElement).closest('button,.panel');
      const crosshair=this.root.querySelector<HTMLElement>('.crosshair')!;
      crosshair.style.left=`${e.clientX-rect.left}px`;crosshair.style.top=`${e.clientY-rect.top}px`;
    },{signal:this.abort.signal});
    this.root.querySelector<HTMLInputElement>('#dash-toggle')!.addEventListener('change',e=>{this.session.world.dashEnabled=(e.target as HTMLInputElement).checked;(e.target as HTMLInputElement).blur();});
    this.root.querySelector<HTMLInputElement>('#debug-toggle')!.addEventListener('change',e=>{this.debug=(e.target as HTMLInputElement).checked;(e.target as HTMLInputElement).blur();});
  }
  update(paused:boolean):void {
    const {world:w,mode}=this.session;
    for(const [selector,visible] of [['.entry',mode==='entry'],['.playing-ui',mode==='playing'],['.death',mode==='dead'],['.settings',this.settings&&mode==='playing'],['.paused',paused&&mode==='playing'&&!this.settings]] as const) {
      (this.root.querySelector(selector) as HTMLElement).hidden=!visible;
    }
    this.root.classList.toggle('menu-open',this.settings||mode!=='playing');
    if(mode!==this.lastMode) {this.clear();this.lastMode=mode;}
    this.root.querySelector<HTMLElement>('.crosshair')!.hidden=!this.pointerInside||mode!=='playing'||this.settings||paused;
    this.root.querySelector<HTMLElement>('.crosshair')!.classList.toggle('wide',w.player.weapon==='shotgun');
    document.querySelector('canvas')!.classList.toggle('aiming',mode==='playing'&&!this.settings&&!paused);
    this.root.querySelector('#armor')!.textContent=String(w.player.armor);
    (this.root.querySelector('#armor-fill') as HTMLElement).style.width=`${w.player.armor/50*100}%`;
    for(const button of this.root.querySelectorAll<HTMLButtonElement>('[data-weapon]')){const active=button.dataset.weapon===w.player.weapon;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
    this.root.querySelector('#hp')!.textContent=String(w.player.hp);
    (this.root.querySelector('#health-fill') as HTMLElement).style.width=`${w.player.hp}%`;
    this.root.querySelector('#ammo')!.textContent=String(w.player.ammo).padStart(2,'0');
    this.root.querySelector('#reserve')!.textContent=String(w.player.reserve);
    this.root.querySelector('.ammo > span')!.textContent=w.player.reloadRemaining>0?'RELOADING…':w.player.weapon==='none'?'UNARMED':WEAPONS[w.player.weapon].name;
    this.root.querySelector('#dash-status')!.textContent=!w.dashEnabled?'DISABLED':w.player.dashRemaining>0?'DASH':w.player.dashCooldown>0?'RECOVERING':'READY';
    const door=nearbyDoors(w)[0],prompt=this.root.querySelector<HTMLElement>('.door-prompt')!;
    prompt.hidden=!door||this.settings;
    if(door) prompt.querySelector('span')!.textContent=door.open?'Close door':'Open door';
    this.root.querySelector('.mission strong')!.textContent=`${w.enemies.filter(e=>e.actor.hp<=0).length} / ${w.enemies.length} hostiles cleared`;
  }
  destroy():void {this.abort.abort();this.root.innerHTML='';}
}
