import {describe,it,expect} from 'vitest';
import {ShotQueue,synthesizeShot,type Gun} from '../../src/client/gunAudio';
import {createWorld} from '../../src/shared/simulation';

describe('gun audio',()=>{
  it('plays a centered human death voice once for the player',()=>{
    const w=createWorld(),q=new ShotQueue();w.player.hp=0;
    w.events.push({id:w.nextEventId++,time:0,kind:'death',pos:{...w.player.pos},direction:{x:0,y:0},actorId:w.player.id,material:'flesh'});
    const sounds=q.take(w);
    expect(sounds.map(s=>s.weapon)).toEqual(['scavenger-death']);
    expect(sounds.map(s=>({volume:s.volume,pan:s.pan}))).toEqual([{volume:1.25,pan:0}]);
    expect(q.take(w)).toEqual([]);
  });
  it('plays each enemy death once, selects its voice, and keeps corpse frames silent',()=>{
    const w=createWorld(),q=new ShotQueue();
    for(const e of w.enemies){e.actor.hp=0;w.events.push({id:w.nextEventId++,time:0,kind:'death',pos:{x:300,y:570},direction:{x:0,y:0},actorId:e.actor.id,material:'flesh'});}
    expect(q.take(w).map(s=>s.weapon)).toEqual(['robot-death','scavenger-death','scavenger-death','dog-death','zombie-death','robot-death']);
    expect(q.take(w)).toEqual([]);w.events=[];expect(q.take(w)).toEqual([]);
  });
  it('cues a dog bite once and drops stale or distant death sounds',()=>{
    const w=createWorld(),q=new ShotQueue();w.time=2;
    const event={time:2,kind:'death' as const,pos:{...w.player.pos},direction:{x:1,y:0},actorId:'dog',material:'flesh' as const};
    w.events=[{...event,id:0,time:0},{...event,id:1,pos:{x:1500,y:1200}},{...event,id:2,kind:'bite'}];
    expect(q.take(w).map(s=>s.weapon)).toEqual(['dog-bite']);expect(q.take(w)).toEqual([]);
  });
  it('plays organic and metal enemy hits, includes surfaces and coalesces simultaneous pellets',()=>{
    const w=createWorld(),q=new ShotQueue();
    const hit={time:0,kind:'impact' as const,pos:{x:300,y:570},direction:{x:1,y:0},actorId:'enemy',material:'flesh' as const,targetId:'enemy'};
    w.events=[{...hit,id:0},{...hit,id:1},{...hit,id:2,actorId:'robot',targetId:'robot',material:'metal'},{...hit,id:3,material:'metal',targetId:undefined}];
    expect(q.take(w).map(s=>s.weapon)).toEqual(['flesh-hit','metal-hit','metal-hit']);expect(q.take(w)).toEqual([]);
  });
  it('plays actual shot events once, including every enemy, without weapon-switch noise',()=>{
    const w=createWorld(),q=new ShotQueue();
    w.player.ammo=3;expect(q.take(w)).toEqual([]);
    for(const [id,weapon] of ['pistol','ar','shotgun'].entries())w.events.push({id,time:0,kind:'shot',pos:{x:300,y:570},direction:{x:1,y:0},actorId:`enemy-${id}`,material:'flesh',weapon:weapon as 'pistol'|'ar'|'shotgun'});
    const shots=q.take(w);expect(shots.map(s=>s.weapon)).toEqual(['pistol','ar','shotgun']);expect(shots.every(s=>s.pan>0&&s.volume<1)).toBe(true);
    expect(q.take(w)).toEqual([]);q.reset();expect(q.take(w)).toHaveLength(3);
  });
  it('routes player and spider rail discharges to distinct powerful cues',()=>{
    const w=createWorld(),q=new ShotQueue();
    w.events=[
      {id:0,time:0,kind:'shot',attack:'rail',pos:{...w.player.pos},direction:{x:1,y:0},actorId:w.player.id,material:'flesh',weapon:'railgun'},
      {id:1,time:0,kind:'shot',attack:'rail',pos:{x:w.player.pos.x+100,y:w.player.pos.y},direction:{x:-1,y:0},actorId:'spider',material:'metal',weapon:'ar'},
    ];
    expect(q.take(w).map(s=>s.weapon)).toEqual(['rail-player-shot','rail-spider-shot']);
  });
  it('routes an untagged railgun event to the player rail sound',()=>{
    const w=createWorld(),q=new ShotQueue();
    w.events.push({id:w.nextEventId++,time:0,kind:'shot',pos:{...w.player.pos},direction:{x:1,y:0},actorId:w.player.id,material:'flesh',weapon:'railgun'});
    expect(q.take(w).map(s=>s.weapon)).toEqual(['rail-player-shot']);
  });
  it('rejects distant and stale shots instead of replaying a backlog',()=>{
    const w=createWorld(),q=new ShotQueue();w.time=2;
    w.events=[{id:0,time:0,kind:'shot',pos:w.player.pos,direction:{x:1,y:0},actorId:'player',material:'flesh',weapon:'pistol'},
      {id:1,time:2,kind:'shot',pos:{x:1500,y:1200},direction:{x:1,y:0},actorId:'enemy',material:'flesh',weapon:'ar'}];
    expect(q.take(w)).toEqual([]);
  });
  it('creates distinct, bounded waveforms with silent ends and deterministic variation',()=>{
    const waves=['pistol','ar','shotgun','dog-bite','dog-death','zombie-death','scavenger-death','robot-death'].map(w=>synthesizeShot(w as Gun,24000,1));
    for(const a of waves){expect(a.every(Number.isFinite)).toBe(true);expect(Math.max(...a.map(Math.abs))).toBeLessThanOrEqual(.91);expect(Math.abs(a[0])).toBe(0);expect(Math.abs(a[a.length-1])).toBeLessThan(.001);}
    expect(waves[2].length).toBeGreaterThan(waves[0].length);
    expect(waves[0]).toEqual(synthesizeShot('pistol',24000,1));expect(waves[0]).not.toEqual(synthesizeShot('pistol',24000,2));
  });
});
