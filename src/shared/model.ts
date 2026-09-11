export type Vec2 = { x: number; y: number };
export type Rect = Vec2 & { w: number; h: number };
export type Blocker = Rect & { id: string; movement: boolean; sight: boolean; shots: boolean };
export type Door = Rect & { id: string; open: boolean };
export type Building = Rect & { id: string; label: string };
export type MapData = { bounds: Rect; blockers: Blocker[]; doors: Door[]; buildings: Building[]; playerSpawn: Vec2; robotPatrol: Vec2[] };
export type WeaponId = 'pistol' | 'ar' | 'shotgun';
export type InputFrame = { grenadePressed?:boolean; grenadeTarget?:Vec2; weaponPressed?: WeaponId; move: Vec2; aim: Vec2; fire: boolean; reloadPressed: boolean; interactPressed: boolean; dashPressed: boolean };
export type Actor = {
  id: string; kind: 'player' | 'robot' | 'scavenger' | 'dog' | 'zombie'; armor: number; maxHp: number; weapon: WeaponId | 'none'; loadout: Partial<Record<WeaponId,{ammo:number;reserve:number}>>; pos: Vec2; radius: number; hp: number; aim: Vec2;
  ammo: number; reserve: number; reloadRemaining: number; shotCooldown: number;
  dashRemaining: number; dashCooldown: number; dashDirection: Vec2;
};
export type Projectile = { id: number; ownerId: string; pos: Vec2; velocity: Vec2; damage: number; remaining: number };
export type Noise = { pos: Vec2; remaining: number; sourceId: string };
export type RobotBrain = { mode: 'patrol' | 'investigate' | 'telegraph' | 'burst' | 'chase' | 'dead'; remaining: number; waypoint: number; lastSeen: Vec2 | null; shotsRemaining: number };
export type Enemy = {actor:Actor;brain:RobotBrain;patrol:Vec2[]};
export type CombatEvent = {targetId?:string;id:number;time:number;kind:'shot'|'impact'|'death'|'explosion';pos:Vec2;direction:Vec2;actorId:string;material:'metal'|'concrete'|'flesh';weapon?:WeaponId};
export type Grenade={id:number;pos:Vec2;start:Vec2;target:Vec2;age:number};
export type World = {
  grenades:Grenade[];grenadeCount:number;nextGrenadeId:number;
  events:CombatEvent[];nextEventId:number;
  time: number; map: MapData; player: Actor; robot: Actor; brain: RobotBrain; enemies: Enemy[];
  projectiles: Projectile[]; noises: Noise[]; nextProjectileId: number; dashEnabled: boolean;
};
