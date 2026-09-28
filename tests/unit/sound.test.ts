import {describe,it,expect} from 'vitest';
import {ShotQueue,synthesizeShot} from '../../src/client/gunAudio';
import {createWorld} from '../../src/shared/simulation';

describe('gun audio',()=>{
  it('plays organic and metal enemy hits, but skips surfaces and coalesces simultaneous pellets',()=>{
    const w=createWorld(),q=new ShotQueue();
    const hit={time:0,kind:'impact' as const,pos:{x:300,y:570},direction:{x:1,y:0},actorId:'enemy',material:'flesh' as const,targetId:'enemy'};
    w.events=[{...hit,id:0},{...hit,id:1},{...hit,id:2,actorId:'robot',targetId:'robot',material:'metal'},{...hit,id:3,material:'metal',targetId:undefined}];
    expect(q.take(w).map(s=>s.weapon)).toEqual(['flesh-hit','metal-hit']);expect(q.take(w)).toEqual([]);
  });
  it('plays actual shot events once, including every enemy, without weapon-switch noise',()=>{
    const w=createWorld(),q=new ShotQueue();
    w.player.ammo=3;expect(q.take(w)).toEqual([]);
    for(const [id,weapon] of ['pistol','ar','shotgun'].entries())w.events.push({id,time:0,kind:'shot',pos:{x:300,y:570},direction:{x:1,y:0},actorId:`enemy-${id}`,material:'flesh',weapon:weapon as 'pistol'|'ar'|'shotgun'});
    const shots=q.take(w);expect(shots.map(s=>s.weapon)).toEqual(['pistol','ar','shotgun']);expect(shots.every(s=>s.pan>0&&s.volume<1)).toBe(true);
    expect(q.take(w)).toEqual([]);q.reset();expect(q.take(w)).toHaveLength(3);
  });
  it('rejects distant and stale shots instead of replaying a backlog',()=>{
    const w=createWorld(),q=new ShotQueue();w.time=2;
    w.events=[{id:0,time:0,kind:'shot',pos:w.player.pos,direction:{x:1,y:0},actorId:'player',material:'flesh',weapon:'pistol'},
      {id:1,time:2,kind:'shot',pos:{x:1500,y:1200},direction:{x:1,y:0},actorId:'enemy',material:'flesh',weapon:'ar'}];
    expect(q.take(w)).toEqual([]);
  });
  it('creates distinct, bounded waveforms with silent ends and deterministic variation',()=>{
    const waves=['pistol','ar','shotgun'].map(w=>synthesizeShot(w as 'pistol'|'ar'|'shotgun',24000,1));
    for(const a of waves){expect(a.every(Number.isFinite)).toBe(true);expect(Math.max(...a.map(Math.abs))).toBeLessThanOrEqual(.91);expect(Math.abs(a[0])).toBe(0);expect(Math.abs(a[a.length-1])).toBeLessThan(.001);}
    expect(waves[2].length).toBeGreaterThan(waves[0].length);
    expect(waves[0]).toEqual(synthesizeShot('pistol',24000,1));expect(waves[0]).not.toEqual(synthesizeShot('pistol',24000,2));
  });
});
