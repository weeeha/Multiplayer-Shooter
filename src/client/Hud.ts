import type {LocalSession} from './LocalSession';
import {WEAPONS} from '../shared/tuning';
import {switchWeapon} from '../shared/combat';
import type {WeaponId} from '../shared/model';
import {nearbyDoors} from '../shared/map';
import {equipmentIcons} from './Sprites';
export class Hud {
  private root=document.querySelector<HTMLDivElement>('#interface')!;
  private lastMode='';
  private abort=new AbortController();
  private pointerInside=false;
  private startingWeapon:WeaponId='pistol';
  settings=false;
  debug=false;
  constructor(private session:LocalSession,private start:()=>void,private clear:()=>void,private fullscreen:()=>void,music:{volume:number;setVolume:(value:number)=>void}) {
    this.root.innerHTML=`
      <div class="brand"><span class="brand-mark">╱</span><div>EXCLUSION<span>ZONE 04 / COLD RELAY</span></div></div>
      <div class="local-badge"><i></i> OFFLINE FIELD TEST</div>
      <section class="entry panel">
        <div class="entry-story"><div class="eyebrow">EXCLUSION ZONE / OPERATION 001</div><h1>COLD<br>RELAY<span>.</span></h1><p class="entry-lead">Nothing here stays quiet.</p><p>Search the abandoned station. Use cover.<br>Survive contact with six hostile targets.</p><button id="start-btn" class="primary">ENTER THE ZONE <span>→</span></button><small>Local combat prototype · No online play or looting yet</small></div>
        <aside class="entry-loadout"><div class="section-label"><span>01 / EQUIPMENT</span><b>SELECT STARTING WEAPON</b></div>
          <button data-start-weapon="pistol" class="selected" aria-pressed="true"><span class="loadout-number">01</span><svg viewBox="0 0 70 28"><path d="M10 6h42v8H30l-4 12H15l3-12h-8z"/></svg><span><strong>9MM PISTOL</strong><small>SEMI-AUTO / 12 ROUNDS</small></span><i>●</i></button>
          <button data-start-weapon="ar" aria-pressed="false"><span class="loadout-number">02</span><svg viewBox="0 0 70 28"><path d="M3 10h17V7h28v3h18v4H45l-4 12h-9l3-12H23l-3 9h-7l2-9H3z"/></svg><span><strong>ASSAULT RIFLE</strong><small>AUTOMATIC / 30 ROUNDS</small></span><i>○</i></button>
          <button data-start-weapon="shotgun" aria-pressed="false"><span class="loadout-number">03</span><svg viewBox="0 0 70 28"><path d="M2 14l16-6h49v5H31v4H20L7 25z"/></svg><span><strong>PUMP SHOTGUN</strong><small>PUMP-ACTION / 6 SHELLS</small></span><i>○</i></button>
          <button data-start-weapon="railgun" aria-pressed="false"><span class="loadout-number">04</span><svg></svg><span><strong>RAILGUN</strong><small>HEAVY / 2 SHOTS TOTAL</small></span><i>○</i></button>
          <p class="kit-note">All four weapons available in the field.<br>3 frag grenades · 50 armor · 100 health</p>
          <div class="section-label"><span>02 / FIELD CONTROLS</span></div><div class="controls"><div><kbd>WASD</kbd> Move</div><div><kbd>MOUSE</kbd> Aim / fire</div><div><kbd>1 2 3 4</kbd> Equip</div><div><kbd>R</kbd> Reload</div><div><kbd>G</kbd> Grenade</div><div><kbd>E</kbd> Door</div><div><kbd>SPACE</kbd> Dash</div></div>
        </aside>
      </section>
      <div class="playing-ui" hidden>
        <div class="mission"><span class="eyebrow">CLEAR THE STATION</span><strong>0 / 5 hostiles cleared</strong><small>Watch the east approach.</small></div>
        <button class="settings-button" aria-label="Open field settings">☰ <span>FIELD MENU</span></button>
        <div class="vitals">
          <div class="condition"><div class="condition-label"><span>OPERATOR / 01</span><b id="condition-status">STABLE</b></div><div class="health"><b class="status-symbol">✚</b><div class="meter"><span>HEALTH</span><div class="health-track"><i id="health-fill"></i></div></div><strong id="hp">100</strong></div><div class="armor"><b class="status-symbol">◇</b><div class="meter"><span>ARMOR</span><div class="health-track"><i id="armor-fill"></i></div></div><strong id="armor">50</strong></div></div>
          <div class="ammo"><div class="weapon-caption"><b id="fire-mode">SEMI</b><span> / EQUIPPED</span></div><span>9MM PISTOL</span><svg class="equipped-gun" viewBox="0 0 70 28" aria-hidden="true"><path id="equipped-shape"/></svg><strong><b id="ammo">12</b><em> / <b id="reserve">48</b></em></strong><div class="magazine-track"><i id="magazine-fill"></i></div><small id="ammo-hint">R / RELOAD</small></div>
          <div class="dash"><kbd>SPACE</kbd><strong id="dash-status">READY</strong><span>DASH</span></div>
        </div>
        <div class="grenade-kit"><kbd>G</kbd><svg viewBox="0 0 24 32" aria-hidden="true"><path d="M8 8V3h8l4 7-2 1-4-6h-3v3h5l4 8-1 11-5 4H8l-5-4-1-11 4-8z"/></svg><span>FRAG</span><strong id="grenade-count">03</strong></div>
        <div class="weapon-rack" aria-label="Weapons">
          <button data-weapon="pistol" aria-label="Equip pistol"><kbd>1</kbd><svg viewBox="0 0 70 28"><path d="M10 6h42v8H30l-4 12H15l3-12h-8z"/></svg><span>PISTOL</span></button>
          <button data-weapon="ar" aria-label="Equip assault rifle"><kbd>2</kbd><svg viewBox="0 0 70 28"><path d="M3 10h17V7h28v3h18v4H45l-4 12h-9l3-12H23l-3 9h-7l2-9H3z"/></svg><span>RIFLE</span></button>
          <button data-weapon="shotgun" aria-label="Equip shotgun"><kbd>3</kbd><svg viewBox="0 0 70 28"><path d="M2 14l16-6h49v5H31v4H20L7 25z"/></svg><span>SHOTGUN</span></button>
          <button data-weapon="railgun" aria-label="Equip railgun"><kbd>4</kbd><svg></svg><span>RAILGUN</span></button>
        </div>
        <div class="crosshair" hidden><svg viewBox="0 0 40 40"><path d="M20 4v7M20 29v7M4 20h7M29 20h7"/><circle cx="20" cy="20" r="1.5"/></svg></div><div class="door-prompt" hidden><kbd>E</kbd><span></span></div>
        <div class="field-footer"><span>WASD MOVE / R RELOAD / G GRENADE</span><span>EXCLUSION — COLD RELAY</span></div>
      </div>
      <section class="settings panel" hidden><div class="eyebrow">OPERATOR TERMINAL / 04</div><h2>FIELD MENU<span>_</span></h2><p class="menu-note">Catch your breath. The field is paused.</p><div class="section-label"><span>SIMULATION</span></div><label><span>Enable dash<small>Short burst · no invulnerability</small></span><input id="dash-toggle" type="checkbox" checked></label><label><span>Collision & sightlines<small>Show debug geometry</small></span><input id="debug-toggle" type="checkbox"></label><label class="music-control" for="music-volume"><span>Background music<small>Ambient / <output id="music-level"></output></small></span><input id="music-volume" type="range" min="0" max="100" step="5" aria-label="Background music volume"></label><button id="fullscreen-btn">FULLSCREEN <span>↗</span></button><button id="restart-btn">RESTART FIELD TEST <span>↻</span></button><button id="resume-btn" class="primary">RETURN TO FIELD <span>→</span></button></section>
      <section class="death panel" hidden><div class="eyebrow">SIGNAL TERMINATED</div><div class="death-mark">×</div><h2>CONTACT<br>LOST<span>.</span></h2><p>The zone took another one.<br>Use cover, keep moving, watch your ammunition.</p><div class="death-summary"><span>HOSTILES CLEARED</span><strong id="death-count">0 / 5</strong></div><button id="retry-btn" class="primary">DEPLOY AGAIN <span>→</span></button><small>Fresh supplies. Same hostile ground.</small></section>
      <div class="paused" hidden><i></i> FIELD PAUSED <span>Click the field to return</span></div>`;
    for(const id of ['pistol','ar','shotgun','railgun'])for(const svg of this.root.querySelectorAll(`[data-weapon="${id}"] svg,[data-start-weapon="${id}"] svg`))svg.outerHTML=`<img class="item-render" src="${equipmentIcons.get(id)}" alt=""/>`;
    this.root.querySelector('.equipped-gun')!.outerHTML=`<img class="equipped-gun" src="${equipmentIcons.get('pistol')}" alt="Equipped pistol"/>`;
    for(const [selector,id] of [['.health .status-symbol','medical'],['.armor .status-symbol','armor'],['.grenade-kit svg','grenade']])this.root.querySelector(selector)!.outerHTML=`<img class="status-item" src="${equipmentIcons.get(id)}" alt=""/>`;
    const musicSlider=this.root.querySelector<HTMLInputElement>('#music-volume')!,musicLevel=this.root.querySelector<HTMLOutputElement>('#music-level')!;
    musicSlider.value=String(Math.round(music.volume*100));
    const showMusicLevel=()=>{const value=Number(musicSlider.value);musicLevel.value=value===0?'Off':`${value}%`;musicSlider.setAttribute('aria-valuetext',value===0?'Off':`${value} percent`);};
    showMusicLevel();musicSlider.addEventListener('input',()=>{music.setVolume(Number(musicSlider.value)/100);showMusicLevel();});
    const click=(id:string,fn:()=>void)=>this.root.querySelector<HTMLButtonElement>(id)!.addEventListener('click',e=>{fn();(e.currentTarget as HTMLButtonElement).blur();});
    for(const id of ['#start-btn','#restart-btn','#retry-btn']) click(id,()=>{this.settings=false;this.start();switchWeapon(this.session.world.player,this.startingWeapon);});
    for(const button of this.root.querySelectorAll<HTMLButtonElement>('[data-start-weapon]'))button.addEventListener('click',()=>{
      this.startingWeapon=button.dataset.startWeapon as WeaponId;
      for(const option of this.root.querySelectorAll<HTMLButtonElement>('[data-start-weapon]')){const selected=option===button;option.classList.toggle('selected',selected);option.setAttribute('aria-pressed',String(selected));option.querySelector('i')!.textContent=selected?'●':'○';}
      button.blur();
    });
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
    this.root.querySelector('#grenade-count')!.textContent=String(w.grenadeCount).padStart(2,'0');
    this.root.querySelector('#armor')!.textContent=String(w.player.armor);
    (this.root.querySelector('#armor-fill') as HTMLElement).style.width=`${w.player.armor/50*100}%`;
    for(const button of this.root.querySelectorAll<HTMLButtonElement>('[data-weapon]')){const active=button.dataset.weapon===w.player.weapon;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
    this.root.querySelector('#condition-status')!.textContent=w.player.hp<=25?'CRITICAL':w.player.hp<70?'WOUNDED':'STABLE';
    this.root.querySelector('#death-count')!.textContent=`${w.enemies.filter(e=>e.actor.hp<=0).length} / ${w.enemies.length}`;
    this.root.querySelector('#hp')!.textContent=String(w.player.hp);
    (this.root.querySelector('#health-fill') as HTMLElement).style.width=`${w.player.hp}%`;
    this.root.querySelector('#ammo')!.textContent=String(w.player.ammo).padStart(2,'0');
    this.root.querySelector('#reserve')!.textContent=String(w.player.reserve);
    const gun=w.player.weapon==='none'?'pistol':w.player.weapon;
    const equipped=this.root.querySelector<HTMLImageElement>('.equipped-gun')!;if(equipped.dataset.equippedWeapon!==gun){equipped.src=equipmentIcons.get(gun)!;equipped.alt=`Equipped ${WEAPONS[gun].name}`;equipped.dataset.equippedWeapon=gun;}
    this.root.querySelector('#fire-mode')!.textContent=gun==='railgun'?'HEAVY':gun==='ar'?'AUTO':gun==='shotgun'?'PUMP':'SEMI';
    const reload=w.player.reloadRemaining>0;
    (this.root.querySelector('#magazine-fill') as HTMLElement).style.width=`${reload?(1-w.player.reloadRemaining/WEAPONS[gun].reload)*100:w.player.ammo/WEAPONS[gun].magazine*100}%`;
    this.root.querySelector('.ammo')!.classList.toggle('reloading',reload);
    this.root.querySelector('.ammo')!.classList.toggle('low-ammo',!reload&&w.player.ammo<=WEAPONS[gun].magazine*.25);
    this.root.querySelector('.health')!.classList.toggle('critical',w.player.hp<=25);
    this.root.querySelector('#ammo-hint')!.textContent=reload?'CHANGING MAGAZINE':w.player.reserve===0?(w.player.ammo===0?'NO AMMO · SWITCH WEAPON':gun==='railgun'?'2 SHOTS TOTAL · NO RESERVE':'NO RESERVE AMMO'):w.player.ammo===0?'EMPTY · PRESS R':'R / RELOAD';
    this.root.querySelector('.ammo > span')!.textContent=w.player.reloadRemaining>0?'RELOADING…':w.player.weapon==='none'?'UNARMED':WEAPONS[w.player.weapon].name;
    this.root.querySelector('#dash-status')!.textContent=!w.dashEnabled?'DISABLED':w.player.dashRemaining>0?'DASH':w.player.dashCooldown>0?'RECOVERING':'READY';
    const door=nearbyDoors(w)[0],prompt=this.root.querySelector<HTMLElement>('.door-prompt')!;
    prompt.hidden=!door||this.settings;
    if(door) prompt.querySelector('span')!.textContent=door.open?'Close door':'Open door';
    this.root.querySelector('.mission strong')!.textContent=`${w.enemies.filter(e=>e.actor.hp<=0).length} / ${w.enemies.length} hostiles cleared`;
  }
  destroy():void {this.abort.abort();this.root.innerHTML='';}
}
