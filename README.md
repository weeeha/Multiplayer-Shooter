# Multiplayer Shooter

A browser-based, three-quarter top-down PvPvE scavenger shooter prototype built with Phaser and TypeScript.

Players enter with a cheap gun, search a ruined environment for equipment and valuables, and choose whether to fight, avoid, or cooperate with other players. Robots, mutated animals, and hostile scavengers create environmental danger. The target is 16+ players, with respawning and loot loss available as separate playtest settings.

## Project status

Design stage. No playable implementation, multiplayer capacity, or performance results have been verified yet.

- [Prototype design and milestone plan](docs/superpowers/specs/2026-09-10-browser-pvpve-prototype-design.md)
- [First playable slice implementation plan](docs/superpowers/plans/2026-09-10-first-playable-slice.md)

## Chosen stack

- Phaser + TypeScript for the browser client.
- Proposed: Vite for development and production builds; a separate Node.js/TypeScript authoritative game server with WebSockets.

## First milestone

A small placeholder street with movement, aiming, shooting, enterable buildings, stationary cars, and line-of-sight visibility. Online play follows before expanding the map or enemy roster.
