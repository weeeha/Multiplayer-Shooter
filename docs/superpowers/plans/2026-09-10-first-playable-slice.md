# First Playable Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Work inline unless the user requests delegation.

**Goal:** Produce a local browser combat playground with movement, a pistol, one robot, two enterable buildings, car cover, and trustworthy line-of-sight presentation.

**Architecture:** Phaser presents a fixed-step TypeScript simulation that has no browser or Phaser dependencies. A local adapter supplies input and reads visible state; the next milestone replaces that adapter with a server connection. Shared geometry owns movement blocking, projectile collision, and visibility.

**Tech Stack:** Phaser 4.2.1, TypeScript 7.0.2, Vite 8.3.0, Vitest 5.0.0, npm. These package versions were returned by the npm registry on 2026-09-10; compatibility must be checked together during installation. The available local runtime was Node 26.0.0/npm 11.12.1. Pin the working dependency set and commit its lockfile.

**Spec:** [Browser PvPvE prototype design](../specs/2026-09-10-browser-pvpve-prototype-design.md).

## Execution update — 2026-09-10

The user authorized implementation with “Okay let's start”, then extended this slice with a crosshair, gun/ammo display, health/armor, pistol/AR/shotgun enemies, a rabid dog and a zombie. The implementation includes these additions and three selectable player weapons for testing. This supersedes the original one-enemy/one-weapon boundary below.

All six implementation task groups have been built in `feat/first-playable-slice`. Changes were implemented inline and consolidated for verification rather than committed after every original checklist item. The original checklist below records the intended sequence; the README, `progress.md` and playtest notes record the executed result.

## Global Constraints

The following requirements are copied from the working design:

- Browser development using Phaser + TypeScript.
- 16+ players in a shared PvPvE map; do not reduce the product target to a small co-op game.
- Prioritize a playable test over large enemy rosters, detailed animation, or finished art.
- Desktop browsers with keyboard and mouse first.
- Keep a fixed gameplay view extent with letterboxing as necessary. Resizing a browser must not provide a larger combat view.
- Explored map surfaces remain dimly visible. Hidden players, enemies, and changing loot contents must not remain visible in remembered areas.
- The server uses the same visibility geometry to decide which remote actors a client is allowed to receive. Hiding an actor only in the renderer is insufficient for this design.

This plan covers milestone 1 only. It does not implement networking, demonstrate 16-player capacity, or select final balance values. The larger working design remains provisional; no new gameplay approvals are inferred from the user's plugin invocation.

## Deliverable and boundaries

An entry screen launches a playable placeholder scene. Controls: WASD move, mouse aim, left mouse fire, R reload, E toggle a nearby door, Space dash when enabled. A small settings panel enables/disables dash, switches debug geometry, and restarts the local scene. Fullscreen uses a clickable button; F stays reserved for future healing.

Show health and pistol ammunition during play. On death, stop gameplay input and show Restart. Destroying the robot leaves a visible wreck when in sight; it does not complete a match. Restart resets everything, including explored space and ammunition.

No inventory, healing, loot, peace signal, extraction, additional guns, permanent saves, accounts, server process, external asset downloads, or public deployment in this milestone. Do not draw controls or clickable buttons for unimplemented systems.

## Files and responsibilities

| Path | Responsibility |
| --- | --- |
| `package.json`, `package-lock.json`, `tsconfig.json`, `index.html`, `.gitignore` | Build/test commands and application entry |
| `src/main.ts`, `src/style.css` | Phaser startup, page layout, fixed logical viewport |
| `src/shared/model.ts` | Simulation types |
| `src/shared/tuning.ts` | Prototype constants |
| `src/shared/geometry.ts` | Ray/rectangle, circle/rectangle, sliding movement |
| `src/shared/map.ts` | Two buildings, doors, windows, cars, bounds |
| `src/shared/movement.ts` | Movement and optional dash |
| `src/shared/visibility.ts` | Sight queries and visibility polygon |
| `src/shared/combat.ts` | Pistol, swept projectiles, damage |
| `src/shared/robot.ts` | Patrol, investigate, telegraph, fire |
| `src/shared/simulation.ts` | Fixed-step orchestration and local world reset |
| `src/client/LocalSession.ts` | Input queue and fixed-step accumulator |
| `src/client/PlayScene.ts` | Scene lifecycle and delegation to input/rendering |
| `src/client/input.ts` | Keyboard, pointer, UI capture, focus reset |
| `src/client/WorldView.ts` | Static map, roof fades, visibility mask, actor presentation |
| `src/client/Hud.ts` | Entry/death/settings screens, health, ammunition |
| `src/client/testHooks.ts` | Deterministic browser test hooks in test mode |
| `tests/unit/*.test.ts` | Geometry, visibility, movement, combat, robot invariants |
| `tests/browser/actions/*.json` | Short browser input sequences |
| `docs/playtests/first-slice-verification.md` | Actual checks, screenshots, measurements, limitations |
| `progress.md` | Implementation progress and remaining work |

Do not import Phaser, DOM types, wall-clock time, or unseeded randomness into `src/shared`. State changes happen inside simulation functions. Phaser never directly sets health, ammunition, or door collision state.

## Shared contracts

Create these contracts in Task 1; subsequent tasks implement the named functions in their assigned files.

```ts
// src/shared/model.ts
export type Vec2 = { x: number; y: number };
export type Rect = Vec2 & { w: number; h: number };
export type Blocker = Rect & {
  id: string;
  movement: boolean;
  sight: boolean;
  shots: boolean;
};
export type Door = Rect & { id: string; open: boolean };
export type Building = Rect & { id: string };
export type MapData = {
  bounds: Rect;
  blockers: Blocker[];
  doors: Door[];
  buildings: Building[];
  playerSpawn: Vec2;
  robotPatrol: Vec2[];
};
export type InputFrame = {
  move: Vec2;
  aim: Vec2;
  fire: boolean;
  reloadPressed: boolean;
  interactPressed: boolean;
  dashPressed: boolean;
};
export type Actor = {
  id: string;
  kind: 'player' | 'robot';
  pos: Vec2;
  radius: number;
  hp: number;
  aim: Vec2;
  ammo: number;
  reserve: number;
  reloadRemaining: number;
  shotCooldown: number;
  dashRemaining: number;
  dashCooldown: number;
  dashDirection: Vec2;
};
export type Projectile = {
  id: number;
  ownerId: string;
  pos: Vec2;
  velocity: Vec2;
  damage: number;
  remaining: number;
};
export type Noise = { pos: Vec2; remaining: number };
export type RobotBrain = {
  mode: 'patrol' | 'investigate' | 'telegraph' | 'burst' | 'dead';
  remaining: number;
  waypoint: number;
  lastSeen: Vec2 | null;
  shotsRemaining: number;
};
export type World = {
  time: number;
  map: MapData;
  player: Actor;
  robot: Actor;
  brain: RobotBrain;
  projectiles: Projectile[];
  noises: Noise[];
  nextProjectileId: number;
  dashEnabled: boolean;
};
```

`InputFrame.move` is a requested movement vector, capped to unit length by movement logic. `InputFrame.aim` is a unit direction from the actor to the pointer's world position, not an absolute destination. Preserve the previous aim for a zero-length vector. All durations are seconds except the browser `advanceTime(ms)` hook. Rectangle coordinates and actor positions use the same world units.

Function contracts:

```ts
// geometry.ts
segmentRectFraction(a: Vec2, b: Vec2, rect: Rect): number | null;
segmentCircleFraction(a: Vec2, b: Vec2, centre: Vec2, radius: number): number | null;
circleTouchesRect(centre: Vec2, radius: number, rect: Rect): boolean;
moveCircle(pos: Vec2, delta: Vec2, radius: number, walls: Rect[]): Vec2;
// map.ts
createTestMap(): MapData;
getBlockers(map: MapData): Blocker[];
toggleNearestDoor(world: World): boolean;
// movement.ts
stepMovement(actor: Actor, input: InputFrame, walls: Rect[], dashEnabled: boolean, dt: number): void;
// visibility.ts
canSee(from: Vec2, to: Vec2, blockers: Blocker[], radius: number): boolean;
visibilityPolygon(from: Vec2, blockers: Blocker[], radius: number): Vec2[];
// combat.ts
stepWeapon(actor: Actor, input: InputFrame, world: World, dt: number): void;
stepProjectiles(world: World, dt: number): void;
// robot.ts
stepRobot(world: World, dt: number): void;
// simulation.ts
createWorld(): World;
stepWorld(world: World, input: InputFrame, dt: number): void;
```

These are contract declarations for the plan, not an instruction to create unimplemented functions. Export each function when its task supplies the implementation. Type imports use the definitions above.

## Task 1: Runnable movement scene and simulation boundary

**Files:** Create build files, `src/main.ts`, `src/style.css`, `src/shared/model.ts`, `src/shared/tuning.ts`, `src/shared/movement.ts`, initial `src/client/PlayScene.ts`, `tests/unit/movement.test.ts`, `progress.md`.

**Consumes:** Empty application repository plus the design. **Produces:** A running scene, shared contracts, `stepMovement`, and the test command.

- [ ] Verify `git status` and preserve unrelated work. Use a task branch for implementation. Read the web-game skill at `/Users/nickv/.codex/skills/develop-web-game/SKILL.md`. Initialize `progress.md` with the user's original prototype request, subsequent Phaser choice, and this plan link.
- [ ] Add a minimal private npm package; install the pinned dependencies and commit the resulting lockfile when the task passes.

```sh
npm install --save-exact phaser@4.2.1
npm install --save-dev --save-exact typescript@7.0.2 vite@8.3.0 vitest@5.0.0
```

Set scripts to `dev: vite --host 127.0.0.1`, `typecheck: tsc --noEmit`, `build: npm run typecheck && vite build`, `test: vitest run`, and `preview: vite preview --host 127.0.0.1`. TypeScript: strict mode, target ES2022, module ESNext, moduleResolution Bundler, DOM/ES2022 libraries, no emit. Ignore `node_modules/`, `dist/`, and `output/`.

- [ ] Write and run a movement test that imports the not-yet-implemented movement function, then implement it. Use the same actor factory locally in movement tests with every field from the contract populated.

```ts
import { expect, test } from 'vitest';
import { stepMovement } from '../../src/shared/movement';
import type { Actor, InputFrame } from '../../src/shared/model';
const actor = (): Actor => ({ id: 'p', kind: 'player', pos: {x: 0, y: 0},
  radius: 12, hp: 100, aim: {x: 1, y: 0}, ammo: 12, reserve: 48,
  reloadRemaining: 0, shotCooldown: 0, dashRemaining: 0, dashCooldown: 0,
  dashDirection: {x: 0, y: 0} });
const input = (x: number, y: number): InputFrame => ({ move: {x, y},
  aim: {x: 1, y: 0}, fire: false, reloadPressed: false,
  interactPressed: false, dashPressed: false });
test('diagonal movement has the same speed as horizontal movement', () => {
  const a = actor(), b = actor();
  stepMovement(a, input(1, 0), [], false, 1 / 30);
  stepMovement(b, input(1, 1), [], false, 1 / 30);
  expect(Math.hypot(b.pos.x, b.pos.y)).toBeCloseTo(a.pos.x);
  expect(a.pos.x).toBeCloseTo(220 / 30);
});
```

- [ ] Put initial constants in `tuning.ts`: simulation step `1/30`, movement speed `220`, radius `12`, dash speed `520`, dash duration `0.14`, dash cooldown `0.75`, sight radius `420`. Normalize movement only when magnitude exceeds one. Aim changes independently of movement. A dash requires a direction and zero cooldown; cooldown begins when the dash ends. Dead actors do not move. Task 2 adds obstacle handling.

```ts
const length = Math.hypot(input.move.x, input.move.y);
const scale = length > 1 ? 1 / length : 1;
const direction = { x: input.move.x * scale, y: input.move.y * scale };
```

- [ ] Render a placeholder actor and aiming line in a fixed logical `960 × 540` canvas using Phaser FIT scaling and centering. Use the current installed Phaser types/docs rather than copying obsolete renderer setup. Start with a ground colour and no asset files. Pointer coordinates must be converted through the camera before aiming.
- [ ] Run `npm test -- tests/unit/movement.test.ts`, `npm run build`, and open the scene. Check independent movement/aiming and equal diagonal speed. Record outcomes and commit only the task's files with `feat: add browser movement playground`.

## Task 2: Map geometry, collision, and doors

**Files:** Create `geometry.ts`, `map.ts`, `tests/unit/geometry.test.ts`, `tests/unit/map.test.ts`; update movement and scene.

**Consumes:** Shared types and movement. **Produces:** Map creation, collision queries, door interaction, and movement that respects solid objects.

- [ ] Write red tests for swept segment intersection and movement against a wall.

```ts
import { expect, test } from 'vitest';
import { segmentRectFraction, moveCircle } from '../../src/shared/geometry';
test('a fast segment hits a thin wall', () => {
  expect(segmentRectFraction({x: 0,y: 10}, {x: 200,y: 10},
    {x: 100,y: 0,w: 4,h: 20})).toBeCloseTo(0.5);
});
test('moving into a wall stops the body and preserves sliding', () => {
  const end = moveCircle({x: 80,y: 50}, {x: 40,y: 20}, 10,
    [{x: 100,y: 0,w: 20,h: 200}]);
  expect(end.x).toBeLessThanOrEqual(90);
  expect(end.y).toBeCloseTo(70);
});
```

- [ ] Implement segment/rectangle using slab intersection, returning the earliest fraction in `[0,1]` or null. Treat a start inside a blocker as fraction zero; explicitly handle parallel axes and zero-length segments. Segment/circle uses the earliest real quadratic root in `[0,1]`. Circle/rectangle uses the closest point on the rectangle. Movement subdivides delta into steps no longer than `radius/2`, applies X then Y collision resolution, and stops flush at blocking surfaces. This bounds dash tunnelling through the map's 16-unit walls. Use boundary walls to keep actors inside the map.

```ts
const count = Math.max(1, Math.ceil(Math.hypot(delta.x, delta.y) / (radius / 2)));
const dx = delta.x / count;
const dy = delta.y / count;
// Each substep resolves X against the nearest blocking surface, then Y.
```

- [ ] Define a `1600 × 1280` map. All map arrays are freshly allocated by `createTestMap()`.

| Object | Geometry / position |
| --- | --- |
| North building | `(320,120,420,300)`, 16-unit exterior walls |
| South building | `(320,760,420,300)`, 16-unit exterior walls |
| North entrance | Opening along south wall from X 500 to 564; matching door |
| South entrance | Opening along north wall from X 500 to 564; matching door |
| Secondary exits | 64-unit open gaps midway along each building's west wall |
| Windows | 64-unit gaps along east walls, with movement-only sill blockers |
| Car A | `(820,580,100,48)` |
| Car B | `(620,650,100,48)` |
| Player spawn | `(180,570)` |
| Robot patrol | `(1100,500)`, `(1100,680)`, `(980,680)`, `(980,500)` |

- [ ] Build walls as segments around openings, not one rectangle spanning the entire building. `getBlockers` combines static blockers with currently closed doors. Windows block actors, but not sight/shots in this proof. Cars block all three.
- [ ] `toggleNearestDoor` uses E's rising edge, maximum 64-unit distance to the door rectangle, and an unobstructed path to its nearest point excluding that door. Do not close a door overlapping either living actor. Break equal-distance choices by door ID. Test open/close, out-of-range rejection, and occupied-door rejection.
- [ ] Route normal movement and dash through `moveCircle`. Draw static map surfaces with different colours for walls, open doors, and cars. Run geometry/map/movement tests and inspect traversal through both building exits. Commit with `feat: add map cover and door collision`.

## Task 3: Line of sight and visible-state presentation

**Files:** Create `visibility.ts`, `src/client/WorldView.ts`, `tests/unit/visibility.test.ts`; update scene.

**Consumes:** Blockers and geometry. **Produces:** `canSee`, `visibilityPolygon`, and actor rendering constrained by visibility.

- [ ] Write and run these tests before implementing the queries.

```ts
import { expect, test } from 'vitest';
import { canSee } from '../../src/shared/visibility';
import type { Blocker } from '../../src/shared/model';
const wall: Blocker = {id:'wall',x:100,y:0,w:16,h:200,
  movement:true,sight:true,shots:true};
test('a wall hides an actor within sight range', () => {
  expect(canSee({x:50,y:100},{x:150,y:100},[wall],420)).toBe(false);
});
test('a doorway reveals only the opening', () => {
  const sides = [{...wall,h:70},{...wall,id:'lower',y:130,h:70}];
  expect(canSee({x:50,y:100},{x:150,y:100},sides,420)).toBe(true);
  expect(canSee({x:50,y:30},{x:150,y:30},sides,420)).toBe(false);
});
```

- [ ] Implement centre-to-centre actor visibility with range checking and sight-blocking segments. The conservative rule is that an actor centre must be visible to render that actor. Clip its actual pixels by the same visibility mask so it cannot protrude through a wall. Range-limited rays cannot see beyond 420 units.

```ts
if (Math.hypot(to.x - from.x, to.y - from.y) > radius) return false;
return !blockers.some(b => b.sight && segmentRectFraction(from, to, b) !== null);
```

- [ ] Build the polygon by casting evenly spaced rays around the player plus rays to blocker corners with angular offsets `-0.0001`, `0`, `0.0001`. Use 192 base angles, clip each ray to the nearest blocker or the range circle, then sort by angle. Test finite sorted output, range bounds, and empty-map behaviour. Recompute when the player position or door state changes, at most once per render frame.
- [ ] Render three layers: unexplored dark ground; dim remembered static map cells; currently visible terrain/actors. A 32-unit exploration grid records cells whose centres pass `canSee`; remembered cells never store actor positions. Draw current actors only from the visible list and mask them. Keep static and dynamic layers separate.
- [ ] Roof opacity uses visible interior samples and a short visual fade, not a switch revealing the whole room. Dynamic occupants remain masked at every opacity. Ensure masks use the camera's coordinate system and move with the world consistently.
- [ ] Run visibility tests plus earlier geometry tests. Visually inspect both sides of a closed door, looking through an open door, entering a room, and hiding behind both cars. Commit with `feat: add line of sight and explored terrain`.

## Task 4: Pistol, swept projectiles, and local damage

**Files:** Create `combat.ts`, `simulation.ts`, `tests/unit/combat.test.ts`; update tuning and scene.

**Consumes:** Geometry, map, movement, visibility. **Produces:** World creation, fixed-step world advancement, weapon cadence/reload, damage, death.

- [ ] Implement `createWorld()` with fresh map/state. Initial player values: 100 HP, 12-round magazine, 48 reserve. Robot: 100 HP, 12/48 ammunition. Actor radius 12. Set both timers and vectors explicitly; robot initially idle until Task 5. World time/next projectile ID start at zero, noises/projectiles empty, dash enabled.
- [ ] Write a red regression test for a projectile crossing a thin wall in one step. The test uses the real world factory and replaces the map blockers to isolate collision.

```ts
import { expect, test } from 'vitest';
import { createWorld } from '../../src/shared/simulation';
import { stepProjectiles } from '../../src/shared/combat';
test('a wall wins before an actor behind it', () => {
  const w = createWorld();
  w.map.blockers = [{id:'wall',x:100,y:0,w:4,h:200,
    movement:true,sight:true,shots:true}];
  w.map.doors = [];
  w.robot.pos = {x:150,y:100};
  w.projectiles = [{id:1,ownerId:w.player.id,pos:{x:50,y:100},
    velocity:{x:6000,y:0},damage:25,remaining:1}];
  stepProjectiles(w,1/30);
  expect(w.robot.hp).toBe(100);
  expect(w.projectiles).toHaveLength(0);
});
```

- [ ] Pistol defaults: damage 25, projectile speed 900, lifetime 0.8 s, shot interval 0.25 s, reload 1.2 s. No random spread in this slice. Holding fire repeats at the interval; reload is edge-triggered. Cannot fire while dead, dashing, reloading, or empty. Reload consumes reserve only on completion and fills up to 12. Test cadence, empty magazine, partial reserve, and fire during reload/dash.
- [ ] Spawn projectiles at the actor centre, ignore only the owner, and draw the tracer from the visual muzzle. This avoids spawning a projectile through nearby cover because the sprite's gun extends beyond its collision body. Resolve earliest swept wall/actor intersection; walls win ties. Destroy a projectile after its first collision and clamp HP to zero.

```ts
// Collision candidates carry fractions; sort ascending, walls before actors on ties.
const next = {x: p.pos.x + p.velocity.x * dt, y: p.pos.y + p.velocity.y * dt};
```

- [ ] Define `stepWorld` order: interact; player movement; player weapon; robot update (from Task 5 when present); projectiles; noise lifetime decrement; world clock. Every timer has one owner and is decremented once. Death disables movement, firing, and door actions. Add a shot-noise event lasting 0.25 s at the actor position. Do not emit exact hidden-actor coordinates to text/UI.
- [ ] Draw visible tracers and short muzzle flashes, and expose player health/ammunition. Manually verify point-blank wall shots, firing through an open window, reloading, and robot death. Run combat plus collision tests and build. Commit with `feat: add pistol projectiles and damage`.

## Task 5: One robot with bounded perception

**Files:** Create `robot.ts`, `tests/unit/robot.test.ts`; update simulation and rendering.

**Consumes:** World, visibility, movement, weapon functions. **Produces:** A patrol enemy that reacts to sight/noise without tracking hidden players.

- [ ] Write a red test showing that a hidden player's movement does not update the robot's last-seen position.

```ts
import { expect, test } from 'vitest';
import { createWorld } from '../../src/shared/simulation';
import { stepRobot } from '../../src/shared/robot';
test('hiding preserves the last observed location', () => {
  const w = createWorld();
  w.robot.pos = {x:50,y:100};
  w.player.pos = {x:150,y:100};
  w.map.doors = [];
  w.map.blockers = [{id:'wall',x:100,y:0,w:16,h:200,
    movement:true,sight:true,shots:true}];
  w.brain.mode = 'investigate';
  w.brain.lastSeen = {x:70,y:100};
  stepRobot(w,1/30);
  expect(w.brain.lastSeen).toEqual({x:70,y:100});
});
```

- [ ] Use a finite-state controller with these exact initial behaviours:

| State | Behaviour and exit |
| --- | --- |
| Patrol | Move at 90 units/s between clear waypoints; sight triggers telegraph; nearby noise within 500 units triggers investigate |
| Investigate | Move toward last observed sight/noise location for up to 3 s; reacquired sight triggers telegraph; timeout returns to patrol |
| Telegraph | Stop and face the observed target for 0.6 s; loss of sight cancels the attack and investigates last seen position |
| Burst | Fire three shots using the shared weapon cadence, requiring sight before each shot; then 0.8 s telegraph/recovery before another burst |
| Dead | Stop all movement, perception, and firing |

- [ ] `lastSeen` stores a copied position only when sight or an audible event supplies it. Noise represents its emission position, not continuous access to the source actor. Use movement collision for every robot displacement. The simple robot can stop at an obstructed investigation route and time out; do not claim full building navigation in this milestone. Keep patrol waypoints in a clear loop.

```ts
const observed = canSee(world.robot.pos, world.player.pos,
  getBlockers(world.map), 420) && world.player.hp > 0;
if (observed) world.brain.lastSeen = { ...world.player.pos };
```

- [ ] Limit robot weapon stepping to one call per simulation tick. Robot ammunition follows the same reload rules; no unlimited fire from zero ammunition. After each shot decrement the burst counter only when a projectile was created.
- [ ] Add tests for wall-blocked sight, interrupted telegraph, noise timeout, and no attack after death. Draw neutral/alert/telegraph colours plus a clear firing cue. Test hiding behind a car, escaping around a building corner, and killing the robot. Run robot and combat tests, build, and commit with `feat: add robot patrol and perception`.

## Task 6: Playable presentation, deterministic checks, and evidence

**Files:** Create `LocalSession.ts`, `input.ts`, `Hud.ts`, `testHooks.ts`, browser action files, verification report; complete scene/world view/main; update README and progress.

**Consumes:** Complete local simulation. **Produces:** A usable local prototype with a repeatable browser verification workflow.

- [ ] `LocalSession` owns an accumulator and calls `stepWorld` at exactly `1/30` s. Hold continuous movement/fire but consume each edge action only on its first simulation step. Clamp normal foreground frame catch-up to 0.1 s; pause this local-only scene on focus loss and clear held inputs. Milestone 2 must replace local pausing with server continuation and resynchronization.

```ts
// Clear edge actions after the first tick without discarding held actions.
const held = {...input, reloadPressed:false, interactPressed:false, dashPressed:false};
```

- [ ] Use a fixed 960×540 logical view at camera zoom 1 and FIT letterboxing. Follow the player within map bounds. Verify that changing window size does not change world-space visible extent or pointer aim. Draw bodies as upright silhouettes anchored at their collision feet, with upper/side faces on cars and buildings to suggest the requested three-quarter view. Use readable olive/grey/rust colours, clear player contrast, and restrained bright effects. Do not use reference screenshots as game textures.
- [ ] Entry screen: title, one-sentence local-test description, controls, Start. During play: HP/ammo, settings button. Settings: dash checkbox, debug geometry checkbox, Restart, Fullscreen. Settings clicks never fire or interact with the map. Death: Restart with a clear local-test explanation. Keep optional debug overlays off by default.
- [ ] On `?test=1`, expose `window.render_game_to_text()` and `window.advanceTime(ms)`. Stop automatic simulation advancement in this mode; advance by exact fixed ticks with a retained fractional accumulator. Input should still be read while stepping. Reject negative/non-finite durations. Text output includes mode, coordinate convention, player, visible robot/projectiles only, nearby door state, ammunition, and dash cooldown. Test hooks must not grant hidden-state access or exist in a normal production entry.

```ts
// Test output contract; values are sourced from current state, not a recorded fixture.
type TestView = {
  mode: 'entry' | 'playing' | 'dead';
  coordinates: 'world units; origin top-left; +x right; +y down';
  player: {x:number;y:number;hp:number;ammo:number;reserve:number;dashCooldown:number};
  visibleRobot: {x:number;y:number;hp:number;state:string} | null;
  visibleProjectiles: {x:number;y:number}[];
  nearbyDoors: {id:string;open:boolean}[];
};
```

- [ ] Read `/Users/nickv/.codex/skills/develop-web-game/references/action_payloads.json` and the installed browser runner's argument help. Use the existing runner, not a replacement. Add local Playwright only if its documented runner cannot resolve an existing installation. Save short input sequences for movement/aim, doorway traversal, wall shooting, robot encounter, and restart. Use the hook's text output to verify intermediate states and screenshots to verify presentation.

```sh
node /Users/nickv/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js --url 'http://localhost:5173/?test=1' --actions-file tests/browser/actions/movement.json --click-selector '#start-btn' --iterations 3 --pause-ms 250
```

The entry button must have ID `start-btn` if using this command. Determine action key names from the runner reference before authoring payloads.

- [ ] Run the full unit suite, typecheck/build, and browser runner. Inspect actual gameplay screenshots and console output. Confirm closed-door occlusion, open-door reveal, roof fades, hidden robot removal, window bullets, car blocking, dash collision, reload, death, restart, UI click suppression, resize and focus recovery. Test both dash settings.
- [ ] Create `docs/playtests/first-slice-verification.md` with command outcomes, actual browser/OS/hardware, screenshot paths, known limitations, and measured frame timing. Measure normal rendering without deterministic test mode for at least 60 s; distinguish achieved FPS from the 60 FPS target. Mark unavailable browser/device combinations untested. Do not claim multiplayer or human playtesting.
- [ ] Update README with verified install/start/test commands and local prototype status; update progress with next milestone: authoritative online combat. Review diff, commit with `feat: finish local combat prototype and verification`, and open the local browser preview for the user. Do not deploy publicly or push automatically as part of this plan.

## Self-review and handoff

- Every milestone-1 acceptance item is assigned: movement/dash (1–2), buildings/cars (2), sight/roof behaviour (3), pistol (4), robot/corner encounter (5), repeatable browser play (6).
- The pure shared simulation and visible-state queries prepare milestone 2 but do not claim server enforcement before a server exists.
- Deferred controls are excluded from the playable UI. Only the pistol is implemented, so no misleading weapon-switch slots appear.
- Balance values are explicitly provisional. Artwork is original placeholder geometry; no copied game assets.
- Execution remains separate from planning. Read the working design and this plan together before implementing.

## Technical sources checked during planning

- [Phaser installation and bundled TypeScript definitions](https://docs.phaser.io/phaser/getting-started/installation)
- [Phaser graphics](https://docs.phaser.io/phaser/concepts/gameobjects/graphics)
- [Phaser cameras](https://docs.phaser.io/phaser/concepts/cameras)
- [Vite setup and build guidance](https://vite.dev/guide/)

These sources establish API/setup context. Gameplay geometry, tuning, tasks, and acceptance criteria above are project proposals, not claims taken from those sources.
