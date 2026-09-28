# Player railgun — 2026-09-10

Slot 4 equips the railgun, also available through the fourth loadout card and starting-weapon menu. Each run supplies exactly two loaded shots and zero reserve. Reload and weapon switching cannot replenish them; restarting a run supplies two again. Empty HUD text directs the player to switch weapons.

Prototype balance: 180 damage per hit, 1.3-second firing interval, 2,200-unit projectile speed and .55-second lifetime. It fires a single shot and respects solid cover. Its two discharge variants combine a recorded transient with an original pressure thump, descending coil snap and energized tail; the spider uses a separate deeper, longer family. Cyan muzzle flash and a bright rail tracer distinguish the player weapon from the other guns. No piercing or ammo pickups are implemented.

Original generated artwork uses the built-in image tool. Runtime atlas conversion preserves source PNGs:

- `public/art/cold-relay/railgun-key.png`: output `exec-66a703b1-2f48-455e-84ff-9f5dffdb5a65.png`. Brief: original worn industrial handheld railgun, horizontal right-facing side profile, olive steel, twin rails and muted cyan charge cells, isolated on magenta for HUD import.
- `public/art/cold-relay/walk/player-railgun.png`: final output `exec-ce909fbe-5b2b-41b8-b64d-1e8d6c2cd88e.png`. Edited the existing player-AR walk sheet to hold the railgun, then corrected front/back foreshortening and shortened the weapon to fit all cells. Four walk phases in five directions, plus mirroring. Idle uses phase zero. Shared muzzle offsets match the compact held weapon.

Four-slot HUD layouts place the rack above condition/ammo panels on narrower screens. Existing three weapons and their ammo behavior remain available.

Verification: all 69 unit tests and the production build passed. Browser checks cover keyboard/click selection, dedicated holding/walking art, exactly two shots and two audio events, no refill through reload or switching, restart, and four-slot HUD bounds/non-overlap from 430 to 1280 pixels wide. Screenshots/state are in `output/player-railgun`.
