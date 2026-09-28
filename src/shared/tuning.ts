export const T = {
  visualAimHeight:24,
  step: 1 / 30, moveSpeed: 220, radius: 12, sight: 420,
  dashSpeed: 520, dashDuration: .14, dashCooldown: .75,
  magazine: 12, reserve: 48, damage: 25, projectileSpeed: 900,
  projectileLifetime: .8, shotInterval: .25, reload: 1.2,
  robotSpeed: 90,
} as const;

export const WEAPONS = {
  railgun: {name:'RAILGUN',magazine:2,reserve:0,damage:180,speed:2200,lifetime:.55,interval:1.3,reload:1,pellets:1,spread:0},
  pistol: {name:'9MM PISTOL',magazine:12,reserve:48,damage:25,speed:900,lifetime:.8,interval:.25,reload:1.2,pellets:1,spread:0},
  ar: {name:'ASSAULT RIFLE',magazine:30,reserve:120,damage:15,speed:1100,lifetime:.8,interval:.1,reload:1.65,pellets:1,spread:0},
  shotgun: {name:'PUMP SHOTGUN',magazine:6,reserve:30,damage:13,speed:800,lifetime:.36,interval:.85,reload:1.8,pellets:6,spread:.32},
} as const;
