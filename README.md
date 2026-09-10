# Multiplayer Shooter

A browser PvPvE shooter prototype built with Phaser and TypeScript. The long-term direction is 16+ players entering a ruined map with a cheap gun, searching for loot, and choosing whether to fight, avoid, or cooperate.

## Play the local prototype

```sh
npm ci
npm run dev
```

Open the local address printed by Vite, then choose **Enter the field**. Desktop keyboard and mouse are required. The current working title is **Exclusion**.

| Control | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Mouse / left button | Aim with crosshair / fire |
| 1 / 2 / 3 | Pistol / assault rifle / shotgun |
| Weapon icons | Click to switch guns |
| R | Reload |
| E | Open or close a nearby door |
| Space | Dash, when enabled |
| Settings | Dash, collision display, fullscreen, restart |

## Implemented

- Two enterable buildings, doors, windows, stationary cars and collision.
- Occluded line of sight, dim explored terrain and fading roofs. Hidden enemies are not rendered.
- Pistol, rapid-fire AR and six-pellet shotgun; separate magazine/reserve ammo for each gun. All three are supplied for this combat test, before introducing looting.
- 100 health and 50 armor. Armor absorbs damage first; overflow reduces health. Neither regenerates in this slice.
- Five hostiles: a pistol robot, an AR scavenger, a shotgun scavenger, a fast rabid dog and a slower zombie.
- Enemy sight/noise response, ranged attack warning, melee cooldowns, damage, death and local restart.
- Original geometric placeholder art, simple weapon sounds, visible crosshair, health/armor and weapon HUD.

The map opens to the east. The AR scavenger patrols the northeast; the dog, zombie and shotgun scavenger occupy the southeast. Keep moving, watch sightlines, and use cover while reloading.

## Current limits

This is a **local combat test**. Online play, 16-player capacity, inventory, loot loss, extraction, healing, armor replacement and persistence are not implemented. Restart resets this test; it is not the eventual respawn/loot-loss experiment. Enemy movement uses direct steering, not navigation around complex obstacles. Balance and artwork are provisional.

## Verification

```sh
npm test
npm run build
npx playwright install chromium
# Keep npm run dev running for browser checks:
node tests/browser/verify.mjs
node tests/browser/arsenal.mjs
```

The build includes type checking. Browser scripts exercise actual controls and save screenshots/state under ignored `output/` folders. `?test=1` enables deterministic stepping and visible-state inspection; normal play omits those hooks.

- [Verification notes](docs/playtests/first-slice-verification.md)
- [Game design and milestones](docs/superpowers/specs/2026-09-10-browser-pvpve-prototype-design.md)
- [First playable implementation plan](docs/superpowers/plans/2026-09-10-first-playable-slice.md)

Networking is the next major milestone: an authoritative TypeScript server, client movement prediction and measured 16-player playtests before expanding the world.
