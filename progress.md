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


## Published startup loading fix — 2026-09-10

- User reported a black screen on the Vercel site in Safari. Observed the same Safari tab eventually show the menu; the published app had no HTML content while the approximately 22 MB artwork loaded and scene textures were prepared.
- Added a self-contained HTML loading screen, real artwork progress, a reload link, and recoverable startup/asset errors. Split the small bootstrap from the dynamically imported Phaser game. The loading overlay is removed only after scene/HUD initialization.
- Startup regression test: tests/browser/startup.mjs. It failed on the old build in Chromium and WebKit with game scripts deliberately held. Fixed build passes initial visibility, forced artwork failure, reload recovery and playable rendering in both engines. WebKit first-paint capture skips Playwright font-ready waiting because the test deliberately holds module requests and the page uses system fonts.
- Other ongoing gameplay edits were changing this checkout and temporarily failing typecheck. Recovered and SHA-1 verified all 97 original deployment files, applied only the startup patch, and built in output/vercel-startup-fix/source. This leaves ongoing gameplay work intact while the fix targets the version users saw.
- Vercel production deployment dpl_3vtACK89BAzdj8piFMZAuZVoxzL9 is READY at https://multiplayer-shooter-umber.vercel.app. Startup changes are also applied to the active source checkout. Build/typecheck and movement/firing runner passed on the isolated release; final live check is recorded under output/startup-live.
- Existing game runner has a 5-second startup click timeout, which was too short under software rendering. A copy in output/startup-gameplay/runner.mjs changes only that timeout to 60 seconds; verified state shows movement, one shot, loaded sound and no audio failures.
- Follow-up opportunity: reduce the original artwork payload and runtime atlas processing. This fix makes loading visible and recoverable; it does not claim faster asset downloads.

- Final live verification passed on the production alias in Chromium and WebKit: initial loading UI visible, menu loaded, playable scene rendered, zero page errors. Fresh uncached requests took about 44 seconds in both engines; this remaining download delay is disclosed. Inspected live gameplay screenshots from both engines. Temporary verification servers were stopped.

## Spider, recorded audio and combat feedback — 2026-09-10

- Implemented the user's accumulated combat requests: dog bite wind-up/contact/recovery, recorded enemy death voices, animated falls/crumples with persistent bodies, shared weapon-muzzle projectile origins, and realistic equipment artwork in the HUD.
- Added a sixth hostile: large six-legged walking rail spider in the southeast. It has 320 HP/60 armor, a 1.2-second rail charge with the last .35 seconds aim-locked, 65-damage rail discharge, and six-round 8-damage close machine-gun bursts. Solid cover cancels charge and blocks projectiles. Railgun and machine-gun anchors match their distinct barrels.
- Generated original equipment and 20-frame spider atlases with the built-in image tool. Runtime import preserves originals. Notes: docs/art/spider-and-field-feedback.md.
- Downloaded and edited 49 CC0 audio samples: real PPQ/AR-15/Mossberg reports, airsoft handling, footsteps, impact foley, dog snarl/whine and performed human/zombie voices. Robot collapse, rail sounds and explosion are designed effects. Source links/licenses in public/audio/field/CREDITS.md; per-file trim/hash provenance plus tools/build-field-audio.py. Verified all WAV headers/hashes, browser decoding and actual playback events; comparison played locally via afplay. Subjective mix acceptance remains with the user.
- Verification: 66 unit tests, typecheck/production build; arsenal, dog bite, weapon presentation, survival UI, baseline controls and grenade browser suites passed. Spider browser encounter verifies normal traversal, aim lock and dodge, death progression, persistent wreck and rail/death audio. First encounter route attracted northern enemies and killed the player; corrected the test sidestep south, preserving game balance.
- Standard game runner's 5-second initial click failed before artwork finished. The same client copied into output/web-game-client.mjs with only a 30-second click timeout passed: movement, shot/ammo consumption and playing state. Inspected the screenshot. Full-page HUD screenshots at desktop/tall/narrow dimensions passed non-overlap checks.
- Concurrent startup/deployment changes were observed in this checkout and preserved. Gameplay changes are local; this work does not claim to update the published Vercel version.
- Inventory references were discussed, but the optional build-versus-layout question received no reply. Inventory remains unimplemented. No online/persistence/capacity claim.

## Player railgun slot 4 — 2026-09-10

- User requested a fourth weapon, a railgun with only a couple of shots. Implemented exactly two loaded rounds and zero reserve per run, 180 damage, 1.3-second cooldown, fast cyan rail projectiles and existing rail-discharge audio. Solid walls stop shots. Switching/reloading cannot refill ammo; restart restores two.
- Added keyboard 4, clickable fourth card and starting-weapon selection; HUD explains limited reserve and directs switching when empty. Separated selected-image metadata from weapon-button attributes to prevent selector ambiguity.
- Built-in image generation created a realistic equipment icon and edited the existing player walk sheet for railgun holding. Corrected the initial sheet's cell overflow and north/south foreshortening before shipping. Dedicated four-phase walking and idle poses use matching muzzle anchors. Notes: docs/art/player-railgun.md.
- Verification: three new regression tests failed before implementation, then all 69 unit tests passed. Production build/typecheck passed. tests/browser/player-railgun.mjs passed keyboard/click selection, dedicated textures, exact two-shot/audio count, reload/switch exhaustion, walking/idle, restart and HUD non-overlap at 1060/900/600/430 widths. Inspected east-facing/firing and narrow-HUD screenshots. Standard game runner exercised the loaded scene and firing; no page errors. Initial browser retry corrected the test's pointer position after clicking a weapon card.
- All unrelated startup/deployment and earlier gameplay edits remain preserved. Changes are in the local preview; no deployment was performed for this request.

## Simple ambient background music — 2026-09-10

- User requested simple background music. Added an original 48-second seamless stereo loop: low hum, slow overlapping pads, breathing pulse and sparse bells. Deterministic synthesis source in tools/build-ambient-music.py, PCM and provenance in public/audio/music. No external samples or borrowed melodies. Played a local audition; final subjective preference remains the user's.
- Dedicated AmbientMusic bus starts only after Enter the zone, at a quiet 20% default. Field Menu volume slider includes Off, persists in localStorage with safe fallback, and fades between values. Music fades out when unfocused/hidden, returns on focus and does not stack on restart. Scene destruction stops/disconnects it; fetch/decode errors are contained so play remains available.
- Browser music suite passed: no entry autoplay, actual 48-second decoded loop, one source, mute/volume persistence, focus fade state, restart, gun sounds and narrow settings. Inspected desktop/narrow menu screenshots. Production build/typecheck and existing unit suite checked; no new page errors. Standard game input runner used for loaded game/audio smoke verification.
- Local changes only; unrelated work is preserved and no deployment was requested.

## More powerful player and spider railgun audio — 2026-09-10

- Replaced the shared pitch-shifted rail report with distinct player and spider discharge families. Both have two deterministic variants combining CC0 firearm transients with original pressure thump, coil snap and energized-tail synthesis. Player shots are 1.28 seconds; spider shots are deeper and longer at 1.62 seconds.
- Replaced the slowed reload-derived spider warning with two original 1.16-second rising charge variants aligned to its 1.2-second telegraph. Runtime routing now keeps the player and spider cue families separate while retaining stereo positioning, distance falloff and the existing limiter.
- The audio builder, manifest, exact source/output hashes and credits are updated. A clean rebuild produced byte-identical rail WAVs; all 53 field files match the manifest and provenance records and decode as mono 24 kHz PCM16.
- Red/green routing coverage distinguishes player and spider rail shots. Player and spider browser encounters verify decoded playback of the new cues, exact player ammo use, spider charge/lock/dodge/discharge, and zero page errors. Full verification: 147 unit tests and production build passed; the existing large-bundle warning remains.
- Audition sequence and spectrogram: `output/railgun-audio/railgun-audition.wav` and `output/railgun-audio/railgun-spectrogram.png`. Order: two player shots, then two charge-plus-spider-discharge sequences. Final sound preference remains the user's listening judgment. Local changes only; no deployment was requested.

## Denser field props and bushes — 2026-09-10

- User requested more props and bushes and approved the bounded scene-polish pass with “go”. Reused the existing Cold Relay atlas so the additions match the established art direction.
- Added denser mirrored roadside/open-field scatter, larger hand-placed bush thickets with occasional rubble, and extra wall utility/rubble dressing. All additions are decorative and keep current doors, collision and combat lanes unchanged.
- Verification: TypeScript and production build passed. The required game runner passed on its existing 30-second startup-timeout copy after the stock 5-second click timeout elapsed during art preparation. The Cold Relay browser suite passed all seven checks with no page errors. Inspected start, north-field/roadside and reset captures; bushes, rubble and utility dressing are visible while doors and the central road stay clear.
- The full unit suite remains at 69 passed / 1 unrelated failure: an existing rail-audio test expects separate player/spider cue names while the current audio queue returns the shared `rail-shot` cue. This scene-only change does not touch audio.

## Publish current game to Vercel — 2026-09-10

- User explicitly requested publishing. Updated existing production project multiplayer-shooter (prj_srpU2DhL8PzkZR1W4wqeoMYdUiFe), alias https://multiplayer-shooter-umber.vercel.app.
- Initial upload failed type checking after concurrent sound edits landed during upload: railgun weapon ID could escape the CombatSound mapping. Added an explicit player-rail sound fallback, preserving the distinct player/spider recordings.
- Froze the corrected source in output/vercel-current-release. All 73 tests and production build passed there; verified all 53 manifest audio assets and the music/spider/railgun art are present. This snapshot avoids further shared-checkout changes during deployment.
- Production deployment dpl_6nk1ZZCecWD7efWuv992wLNCRRux completed READY and aliased successfully. Immutable URL: https://multiplayer-shooter-eano0jxsd-pegbo.vercel.app. Includes current combat, four weapons, spider, realistic HUD/audio, music and startup loader.
- Vercel CLI confirmed production readiness. Browser release checks use the identical built files served locally; this does not claim an HTTP/browser check of the production alias.
- Frozen production artifact passed Chromium and WebKit browser checks: all six hostiles/seven actor renderers, railgun equip and shot/ammo/audio, background music decoded/playing, no page errors. Inspected WebKit gameplay screenshot. Temporary release preview server stopped after verification; regular 5173 dev server remains available.
