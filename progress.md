Original prompt: Plan and build a minimal PvPvE shooter prototype to test core controls and mechanics, with 16+ players as the multiplayer target, line of sight, buildings and cars, and experiments with respawn versus loot loss. User selected Phaser + TypeScript and authorized implementation with "Okay let's start".

Plan: docs/superpowers/plans/2026-09-10-first-playable-slice.md

## Execution

- Working on feat/first-playable-slice in the project checkout. Initial baseline contains documentation only; no existing executable tests.
- Milestone 1 is local combat/visibility. Multiplayer, loot and permanent progression remain subsequent milestones.
- Tasks: foundation/movement; map/collision; visibility; pistol/damage; robot; browser verification.

## Local slice and requested combat expansion — 2026-09-10

- Built the six planned local groups: movement; map/doors; visibility; swept projectile combat; enemy behavior; UI and browser verification.
- User extended the active work: crosshair, gun/ammo, health/armor, shotgun/AR/pistol enemies, rabid dog and zombie. Interpreted “shotring” as shotgun and stated that assumption.
- Added 1/2/3 and clickable loadout slots, per-weapon ammo, shotgun spread, AR cadence, armor damage absorption, multiple enemy actors, melee and visible labels. Restart supplies all guns solely for testing, without implying a loot system.
- Corrected Phaser 4 WebGL masking using external filter masks (legacy geometry masks are Canvas-only), aim alignment with the sprite body, and car visibility.
- Red/green unit checks cover collision, occlusion, weapon cadence, armor overflow, ammo-preserving switches, melee cooldown/walls, dead enemies, shotgun closing to effective range, and offscreen engagement. Enemy vertical engagement now stays within 220 world units of the player to avoid surprise shooting beyond the fixed view.
- Standard develop-web-game runner used for movement and combat; supplemental Playwright scripts cover keys beyond its supported mapping, UI, resize and enemy routes.
- Browser integration caught a shooter attacking outside the vertical camera view. Added a failing regression test, then constrained engagement. The final browser rerun passed after the correction.
- Earlier 60-second headless timing used SwiftShader software rendering: 25.7 mean animation frames/sec in the original one-enemy scene. This does not establish hardware GPU performance or 16-player capacity.

Next major work: authoritative online server and real 16-player tests, then loot/respawn experiments. Current limitations: local only, placeholder art, direct enemy steering, no inventory/extraction/armor replenishment. Do not claim multiplayer or GPU performance validation from these local tests.

- Final verification: 37 unit tests, TypeScript check, production build, standard web-game runner and both supplemental browser suites passed. Inspected weapon/crosshair, dog, zombie, both scavengers, resized HUD and final movement screenshots. Browser error lists are empty; build size and screenshot-only GPU warnings are documented. Local preview remains available at http://127.0.0.1:5173/.
