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

## Cold Relay art pass — 2026-09-10

- User selected concept B, then explicitly approved applying it. Used the existing branch and unchanged collision/combat balance.
- Built-in image generation produced character, prop and material atlases. Initial character/prop transparency was a baked checkerboard; generated flat-magenta corrections and used runtime color-key atlas loading. Source PNGs are unchanged in public/art/cold-relay; prompts/provenance are in docs/art/cold-relay.md.
- Added three poses per character plus mirroring, prefiltered to native gameplay size, with separate mouse-aimed guns. Shared visualAimHeight=24 aligns torso, gun and projectiles. Full walking/attack/death animations remain future work.
- Replaced ground, pavement, roof and floor materials; added generated wrecked cars, roof vents and low decorative verge dressing. Visual detail was reduced after screenshot inspection to protect readability.
- Added cosmetic shot/impact/death events, casings, smoke/dust, material-specific debris/sparks, impact marks and recoil. Effects use true collision locations and visibility gating, with bounded event/particle history and restart clearing.
- New red/green checks cover event creation, wall impact position, robot destruction, event expiry and torso aiming. Final verification passed: 40 unit tests, TypeScript/production build, all three browser suites and the standard web-game runner. Inspected street, muzzle/door impacts, robot sparks, all enemy designs and HUD screenshots. Existing preview shows the Cold Relay entry screen.

## Sound, armed sprites, HUD and grenades — 2026-09-10

- User requested improved gun sounds, weapon-specific holding poses, a styled UI, then grenades and walking cycles for everyone.
- Replaced sawtooth buzz/ammo-delta detection with cached layered procedural samples and actual shot events. All shooters are audible with distance/panning, variation and bounded voices. Shotgun, AR and pistol have different transients, body and tails; grenade explosion has a deeper sample. Browser audio unlock, sample duration, repeated fire and no switch noise verified. Comparison WAV rendered and played with afplay; subjective listening acceptance remains with user.
- Rebuilt HUD with distinct health/armor panels, large ammo/readiness display, reload progress, selected weapon cards, Cold Relay entry screen and grenade count. Responsive checks at 600x700, 900x1000 and standard desktop passed.
- User rejected flat procedural arms. Removed them and generated full armed poses with compact shaded grips, five facings plus mirroring. Corrected south/SE foreshortening through built-in image editing. Adjusted row cropping for robot antenna spill and anchored sprites at boots. Source armed-characters-key.png is retained; no Scavland assets copied into game.
- G throws one grenade per press toward the cursor, capped at 280 units. Three per run, .6sec visual flight, 1.4sec fuse, 115-unit blast with armor-aware falloff and solid-cover protection. Solid geometry stops throws. Arc, fuse, flash, debris, smoke, explosion sound, self-damage and restart refills implemented.
- Current checks: 47 unit tests and typecheck/build passed; weapon/audio presentation and grenade browser suites passed; baseline combat/UI suites passed before grenade integration. Walking sprite sheets are being generated; final integrated verification is pending.
- Walking implementation completed: eight source atlases (three player weapons and five enemies), four distance-driven frames per bearing, reverse stepping on retreat, idle on stop. Native-size texture caching detects row gaps, preserves full sprites and anchors heads/torso through the stride.
- Final animation checks: 49 unit tests and production build passed. Player pistol/AR/shotgun each cycle all four frames and return to rest. Arsenal browser suite observed robot, AR scavenger, shotgun scavenger, dog and zombie walking and defeated all five through normal movement. Grenade and presentation suites passed with current art; standard game runner screenshot inspected. Browser errors are empty; existing bundle-size warning remains.
- Exact generation prompts, source IDs, limitations and asset locations are in docs/art/combat-presentation.md. Video evidence is output/walk-verification/walking.mp4. User-facing preview remains http://127.0.0.1:5173/. No online-capacity or hardware-frame-rate claim.

## Survival interface and enemy hit feedback — 2026-09-10

- User requested blood and enemy hit sounds, then a complete interface redesign, selecting gritty survival: worn metal, compact bars, muted amber.
- Added directional blood droplets and bounded ground stains for flesh hits/deaths, retaining robot/armor sparks. Projectile and grenade cosmetic events identify targets. Added cached flesh/metal impact samples with stereo distance falloff and 60 ms per-target coalescing for shotgun pellets.
- Rebuilt condition, ammo, reload, weapon, grenade, entry, field and death interfaces with existing surface texture and CSS. Starting weapon choice is functional. Retained keyboard controls, pause behavior and test loadout.
- Final checks: 51 unit tests and production build; arsenal, baseline, weapon presentation and survival UI browser suites. Standard game runner completed on retry after an initial click timeout under concurrent browser load. No page errors. Inspected entry, HUD, settings, death, narrow layouts and living-organic-target blood screenshot. Browser observed both impact audio sample types; subjective listening remains user acceptance.
- Design details and saved screenshots: docs/art/survival-ui-and-hit-feedback.md. Existing bundle-size warning and local-only prototype limits remain.
