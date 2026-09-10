# Browser PvPvE prototype: design and milestone plan

Date: 2026-09-10

Status: Working design for review. Phaser + TypeScript is selected. No game implementation or performance validation has taken place.

## Purpose

Build the smallest playable game that can test responsive shooting, scavenging, uncertain encounters with other players, and the difference between respawning and losing a run. Use placeholder artwork and minimal animation.

This document records the gameplay direction and orders the work. It is not a completed implementation or a promise of measured player capacity.

## Confirmed direction

- Browser development using Phaser + TypeScript.
- 16+ players in a shared PvPvE map; do not reduce the product target to a small co-op game.
- Players enter with a cheap gun and search for loot.
- PvP is possible, but players can avoid each other or cooperate.
- Environmental enemies: robots, mutated animals, and hostile scavengers.
- Three-quarter top-down presentation with the gritty pixel-art atmosphere of the supplied images.
- Line of sight, buildings, and cars matter to the environment.
- Experiment with respawning and loot loss before selecting permanent death rules.
- Prioritize a playable test over large enemy rosters, detailed animation, or finished art.

## References and interpretation

- Supplied screenshots: subdued earth colours, industrial ruins, abandoned streets, wrecks, dead vegetation, small human figures, and bright combat effects. References only; they are not licensed production assets.
- [Atomic Exile](https://store.steampowered.com/app/2956440/Atomic_Exile/): reference for the environment, scavenging, buildings, cars, and the user's interest in visibility.
- [Super Animal Royale](https://store.steampowered.com/app/843380/Super_Animal_Royale/): primary reference for overall moment-to-moment mechanics. Its [official site](https://animalroyale.com/) describes run-and-gun combat and line-of-sight fog of war.
- Soldat and Crimsonland: earlier references for responsive PvP and varied top-down weapons.

These references do not establish requirements for a shrinking zone, forced last-player-standing victory, driveable vehicles, or any particular game engine implementation.

## Proposed playtest defaults

The following are adjustable starting rules, not individually approved final decisions.

### Session and progression

- Desktop browsers with keyboard and mouse first.
- Start testing at 16 connections; test 24 and 32 only after the 16-player target passes. Larger counts are exploratory until measured.
- One hand-authored map. Begin with a small combat area, then expand and repeat landmarks for the 16-player playtest.
- A host starts and ends a test session; first timed preset is 15 minutes. Players may enter while the session is active.
- Each new entrant receives the same free pistol, initial ammunition, and one heal.
- A server-held stash lasts for the playtest session. No accounts, permanent economy, buying equipment, or crafting in the first complete loop.
- Deposits transfer valuables to the stash and remove them from the backpack. Ending a session does not automatically bank items still carried.
- Show banked value and survival information without requiring player kills for progress.

### Controls

| Input | Action |
| --- | --- |
| WASD | Move independently of facing |
| Mouse | Aim |
| Left mouse | Fire |
| R | Reload |
| 1 / 2 | Switch between two weapons |
| E | Interact with a nearby door, container, dropped bag, or deposit/exit |
| Tab | Toggle backpack |
| F | Use a healing item |
| Q | Lower or raise weapon as a visible social signal |
| Space | Short dodge/dash, available as a playtest toggle |

Use normal movement plus the optional dash initially. The earlier Shift-sprint suggestion is deferred so the first test has one movement modifier. The dash cannot pass through obstacles, prevents firing, has a short recovery, and grants no invulnerability by default. It can be represented by a sliding sprite.

Backpack browsing does not pause the match. Movement stays available; clicking UI must not fire the weapon underneath it. Healing is interrupted by damage or firing. Lowering a gun grants no protection. Raising it again is required to fire.

### Camera and visibility

- Fixed three-quarter top-down view; no camera rotation or player elevation in the prototype.
- Use flat collision geometry with sprites drawn to suggest height. Phaser's 2D renderer does not prevent this presentation.
- Begin with all-around visibility within a fixed radius, clipped by obstacles. A directional vision cone is a later experiment.
- Walls and closed doors block sight and shots. Open doors and windows expose only their visible areas; prototype windows are open apertures that also allow shots.
- Car wrecks initially block both sight and bullets. Separate the two properties in map data so a later low-cover experiment does not require replacing the collision system.
- Explored map surfaces remain dimly visible. Hidden players, enemies, and changing loot contents must not remain visible in remembered areas.
- Fade roofs and foreground decoration only where needed to show valid visible space. Fading a roof must never reveal occupants through walls.
- Sound can indicate nearby activity without displaying an exact enemy marker through cover.
- Keep a fixed gameplay view extent with letterboxing as necessary. Resizing a browser must not provide a larger combat view.
- The server uses the same visibility geometry to decide which remote actors a client is allowed to receive. Hiding an actor only in the renderer is insufficient for this design.

### Combat

- Pistol, automatic rifle, and shotgun. No attachments, headshots, body-part simulation, armour system, or melee initially.
- Use simple travelling projectiles with visible tracers. Check swept movement between simulation steps to prevent shots skipping thin walls or actors.
- Shared weapon definitions contain damage, projectile speed, spread, cadence, magazine size, reserve ammunition limits, and reload duration.
- Server owns damage, ammunition, weapon cadence, and death. Clients send actions rather than claims that another actor was hit.
- Tune health to allow reacting and retreating; exact balance values are implementation defaults to measure in playtests.
- Nearby gunshots alert environmental enemies. Player damage is enabled for everyone; there is no formal squad system in this slice.

### Loot

- Two weapon slots plus six simple backpack slots; no inventory grid packing.
- Item categories: weapons, ammunition, healing items, and valuables.
- Interaction requires proximity and a clear reachable interaction path. Do not permit looting through walls.
- Clicking a loot item requests a server transfer. The server checks ownership, capacity, and proximity atomically so two players cannot duplicate one item.
- Provide several deposit/extraction locations on the full test map.
- Cars initially offer cover and searchable trunks. Driving, repairs, fuel, and vehicle combat are outside the first prototype.

### Enemy scope

| Type | First behaviour | Purpose |
| --- | --- | --- |
| Robot | Patrol, investigate noise, telegraph a burst, shoot | A defended route or loot location |
| Mutated animal | Detect, chase, attack at close range | Pressure to move out of cover |
| Hostile scavenger | Guard loot, investigate noise, shoot with imperfect accuracy | A ranged threat worth avoiding or clearing |

Start with one robot to develop combat and perception. Add one example of each remaining type, then aim for 6–8 active enemies across the complete test map. AI and navigation run on the server. Losing sight causes investigation of the last seen location rather than tracking a hidden player exactly. Simple state colours, facing indicators, sound, and death markers are sufficient.

### Death-rule experiments

Configure two independent room settings:

| Setting | Values |
| --- | --- |
| Return after death | Delayed respawn / limited lives / out for the run |
| Loot loss | Drop everything carried / drop only items acquired during the run |

First compare delayed respawn with out-for-the-run while keeping full loot loss the same. Test limited lives and the lighter loot penalty after that comparison.

- Respawn: drop the configured items and return with a free starter kit after a short delay. After a successful deposit the player remains on the map.
- Extraction: death ends participation in that test session; successful extraction banks carried valuables and equipment, then returns the player to staging. No automatic re-entry during that session.
- Limited lives: use the same starter respawn until the configured life count is exhausted, then return to staging.
- Under the lighter penalty, retained starter items are restored only once; never both create a world drop and retain the same item. Tag item origin on the server.
- Prefer spawn points away from live players, enemies, and recent combat. When all are unsafe, keep the entrant in staging and retry rather than forcing an unsafe spawn.
- A brief connection interruption does not make the character invulnerable or create a new starter kit. Keep the body in the simulation, allow token-based reconnection, and return the server's current state. Full disconnect timeout behaviour must be explicit in the implementation design.
- Show clear instructions for each room's death and deposit/extraction rules before entry.

## Proposed architecture

- **Browser client:** Phaser + TypeScript, with Vite for development/builds. Phaser handles drawing, input, camera, audio, and the local gameplay presentation.
- **Game server:** Node.js + TypeScript, with a persistent WebSocket connection per player. Owns simulation, enemies, visibility, loot, session rules, and session stash.
- **Shared package:** engine-independent movement/collision helpers, protocol types, map definitions, and tuning data used by client and server.
- **Responsiveness:** predict local movement, acknowledge numbered inputs, reconcile to server state, and interpolate visible remote actors. Hit feedback becomes confirmed only after the server resolves it.
- **Timing:** initially target a 30 Hz fixed server simulation, 15 Hz snapshots, and display rendering at the browser's refresh rate. These are starting budgets, not measured results.
- **Validation:** validate message shape, finite coordinates, action rates, sequence numbers, and interaction permissions. Bound message sizes and queues; disconnect malformed or flooding clients.
- **Hosting:** static browser files plus a separately running game-server process. Static hosting alone does not run multiplayer. Use HTTPS/WSS for a shared playtest deployment.
- **Dependencies:** select supported versions against official documentation at implementation time and pin them in a lockfile. Do not assume browser clients can use native UDP sockets.

WebSockets are a proposed first transport because they are widely supported. Measure combat under delay and packet loss early; ordered delivery can delay newer updates. Keep transport separate from simulation so it can be revised if measurements justify it.

## Milestones

### 1. Movement, combat, and visibility proof

Deliver a local browser scene with one street, two enterable buildings, an alley, stationary car wrecks, a pistol, and a robot. Use plain sprites, simple muzzle flashes, and visible debug geometry when enabled.

Acceptance: aim and move independently; walls stop movement and shots; a doorway reveals only its sightline; roof fading does not reveal hidden occupants; turning a corner produces understandable combat; dash can be toggled for comparison.

### 2. Online combat proof

Move authority to the shared server simulation and connect multiple browser clients before adding more content. Add reconciliation, visibility filtering, reconnect handling, and server-owned damage/death.

Acceptance: two players agree on position and damage; no hidden actor positions appear in unauthorized client snapshots; reconnect does not duplicate a character; then run 16 active simulated clients. Simulated clients prove load behaviour, not the experience of 16 human players.

### 3. Complete scavenging and death loop

Add the remaining two weapons, inventory, containers, dropped bags, session stash, deposits/extraction, and the independent death settings. Expand the test map for several simultaneous encounters.

Acceptance: race two players for the same item without duplication; complete a run without attacking a player; verify each death preset and safe respawning; observe whether players can retreat, recover, and re-enter play as designed.

### 4. Human PvPvE playtest

Add the animal and scavenger, the peace signal, lightweight sound cues, and 6–8 active enemies. Tune sightlines, spawn distances, loot distribution, and combat from actual sessions.

Acceptance: test 16 real concurrent players when testers are available; compare death presets; record performance and feedback separately. Explore 24/32 capacity only after the baseline works.

## Verification and evidence

- Unit tests for collision, projectile sweeping, visibility geometry, inventory transfer invariants, and death-rule item ownership.
- Network integration tests for conflicting loot actions, repeated inputs, invalid messages, reconnect, and visibility-filtered snapshots.
- Browser checks for aiming, UI click handling, resizing, fullscreen entry, focus loss, and returning after background throttling.
- Exercise the online prototype at controlled 50, 100, and 150 ms round-trip delay and under connection loss; record corrections and hit-feedback delay.
- Target 60 FPS at 1080p on named test machines. Record actual frame times and server tick duration, along with browser, hardware, actor count, and test length. Targets are not guarantees.
- Check current Chrome, Firefox, and Safari on available hardware; explicitly mark untested browser/OS combinations.
- Playtest metrics: time between encounters, deaths shortly after spawning, survival duration, banked loot/extraction success, disconnects, and reported fairness. Ask players about cooperation and trust rather than assuming telemetry can infer intent.

## Deferred scope

Finished art, detailed animation, large enemy populations, procedural worlds, permanent accounts/economy, shops, crafting, armour simulation, squads, voice chat, vehicles that drive, destructible buildings, elevation, controller/mobile controls, and native packaging.

## Next design checkpoint

Review this working design before writing a detailed executable implementation plan. The first implementation plan should cover milestone 1 only, with the shared simulation boundary defined so milestone 2 can follow immediately.
