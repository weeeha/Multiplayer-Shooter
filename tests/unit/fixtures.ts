import type { Actor, InputFrame } from '../../src/shared/model';
export const actor = (): Actor => ({ id:'player',kind:'player',armor:50,maxHp:100,weapon:'pistol',loadout:{},pos:{x:0,y:0},radius:12,hp:100,aim:{x:1,y:0},ammo:12,reserve:48,reloadRemaining:0,shotCooldown:0,dashRemaining:0,dashCooldown:0,dashDirection:{x:0,y:0} });
export const input = (overrides: Partial<InputFrame> = {}): InputFrame => ({move:{x:0,y:0},aim:{x:1,y:0},fire:false,reloadPressed:false,interactPressed:false,dashPressed:false,...overrides});
