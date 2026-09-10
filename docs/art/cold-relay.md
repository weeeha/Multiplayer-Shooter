# Cold Relay — first playable art pass

Selected by the user: concept B / Cold Relay. Implementation authorized with “okay proceed”.

## Delivered

- Six character designs: pale-hood player, maintenance robot, AR scavenger, shotgun scavenger, rabid dog and zombie.
- Three base facings per character plus horizontal mirroring. Sprites are filtered once to the actual 48-unit human / 28-unit dog display size. Weapons remain separate overlays with free mouse aiming; the shared torso plane is 24 units above ground.
- Cool asphalt/concrete/floor/roof materials, two wrecked cars, rooftop ventilation, wall-mounted cabinets, low verge dressing and maintenance marks. Solid collision geometry remains unchanged.
- Muzzle flash and glow, recoil, casings, smoke, movement dust, concrete chips, metal sparks, short-lived impact marks and enemy destruction effects.
- Effects originate at actual projectile collision locations. Their origin must be visible; particles and event history are bounded and reset with the run.
- Slate/cyan HUD treatment with restrained warm accents.

## Asset files

Saved under `public/art/cold-relay/`:

| File | Purpose | Generated source ID |
| --- | --- | --- |
| characters-key.png | 3-column × 6-row character atlas | exec-cec757b5-4afc-4b6c-91a6-37b7336bff2c |
| props-key.png | 2-column × 3-row prop atlas | exec-1aa84bcd-ba16-43a7-b064-c0cc7b881f40 |
| surfaces.png | Four opaque tileable material regions | exec-2e43155c-d363-4b6d-abdf-e05227ad5146 |

Generated using the built-in image-generation tool with the selected B concept as a style reference. No Steam screenshot was imported as a game texture. These are generated prototype assets, not hand-authored production animation sheets.

The first character/prop outputs contained a baked checkerboard rather than alpha. The built-in tool produced corrected flat-magenta versions. The game’s atlas loader discards magenta pixels, trims each cell, and builds transparent engine textures at startup. Original PNGs are retained unchanged. Zombie front/side poses face left in the generated sheet and are mirrored appropriately by the renderer.

## Verification and practical limits

Verification passed: 40 unit tests, TypeScript checking, production build, three browser suites and the standard web-game runner. Unit tests cover cosmetic event creation, exact impact coordinates, destruction events, expiry and revised torso alignment alongside the existing combat checks. Browser suites exercise doors, all five enemy encounters, weapon switching, death/restart, resize and the new effects. Results and screenshots are under `output/cold-relay-verification/`, `output/arsenal-verification/`, and `output/browser-verification/`. Browser error lists are empty; the build retains its existing large-bundle warning.

Saved gameplay captures: [street and HUD](../playtests/assets/cold-relay-street.png), [muzzle flash](../playtests/assets/cold-relay-combat.png).

This is a first art pass: no full authored walking, firing or death animation cycles. Movement uses a small procedural bob and dead sprites use a rotated pose. Material repetition and room dressing can be refined after playtesting. The PNG assets add about 6 MB before optimization. This work does not verify hardware GPU frame rate or multiplayer capacity.

## Generation prompts

### characters

Create a PRODUCTION GAME SPRITE ATLAS derived from the six character designs in the bottom strip of the supplied Cold Relay concept reference. Supporting reference only; output sprites, NOT another concept board. Transparent RGBA background, no checkerboard drawn, no floor, no cast shadows, no labels, no border, no effects. Exact uniform grid: THREE columns and SIX rows, 18 equal square cells, portrait image aspect 1:2 (ideally 1024x2048). Each cell contains ONE complete isolated character centered horizontally, feet on a common baseline 85% down each cell; entire body contained within cell with 15% padding. Absolutely no overlap. All cells identical scale, humans about 70% of cell height. Camera elevated three-quarter top-down, approximately 50 degrees down from horizontal as in gameplay. Columns are same character in three orientations: column1 facing southeast (down-right, chest visible); column2 facing east (right profile); column3 facing northeast (up-right, back visible). Rows: 1 white hooded player scavenger, dark face visor, charcoal pants, olive salvage backpack, small rusty orange pouch. 2 compact boxy blue-gray maintenance robot, two mechanical legs, amber rectangular optic, dark joints, orange warning tabs. 3 AR scavenger, rusty orange beanie/hood, charcoal utility clothes and olive backpack. 4 stockier shotgun scavenger, dark gray hood, tan plate vest, shell loops. 5 lean rabid dog, black-brown coat, rusty mange patches, four legs, pointed ears, long tail; canine horizontal proportions at 40% human height. 6 gaunt zombie, pale gray skin, ragged moss coat, dark torn trousers, empty hands extended, stooped posture. IMPORTANT humans and robot hold hands/arm ready to carry a weapon BUT NO guns or separate objects are painted; weapons are independently aimed overlays in engine. Dog and zombie entirely unarmed. Cohesive original crisp hand-painted 2D sprite art with selective pixel edges, cool slate/eucalyptus/gray palette and clear lighter player silhouette; detailed but broad readable color shapes, matte materials, restrained shading. Every sprite must have real clean alpha around it. This is a functional sprite sheet, no text or composition beyond the strict 3x6 grid.

### props

Produce a production game prop sprite atlas using the supplied Cold Relay image as supporting STYLE reference, not an edit target. Transparent RGBA background, no checkerboard, no scene, no floor, no text, no labels, no shadows outside objects. Strict TWO columns by THREE rows of equal square cells, portrait 2:3 aspect ideally1024x1536. One isolated prop centered in each cell with wide clear margins, no overlapping cells. Upper-left: wrecked dark slate blue civilian hatchback, nose points precisely right/east, high three-quarter camera roughly50 degrees down, showing roof and near side; horizontal rectangle proportions2:1. Upper-right: rusty red abandoned sedan, identical scale, orientation, camera and2:1 proportions. Middle-left: a battered gray-blue electrical cabinet with small orange warning plate, compact freestanding rectangular single prop. Middle-right: industrial rooftop ventilation unit, steel-gray fins, chunky rectangular base, top visible. Lower-left: a low pile of broken concrete chunks, scraps of rusty metal and a few dry weeds, flat decorative verge prop. Lower-right: a dense moss-and-dry-grass clump, low green-brown vegetation for edges. Same crisp textured hand-painted 2D sprite style as reference, cool concrete slate eucalyptus palette, original distinct forms, modest rust, soft broad highlights, restrained details. Entire object in each cell visible. Transparent pixels around EVERY prop. No human characters, no extra objects beyond specified, no typography.

### surfaces

Create a game material texture atlas for the supplied Cold Relay reference aesthetic. Supporting STYLE reference only. Output is strictly a SQUARE image split into exactly FOUR equal square quadrants, a 2x2 grid, with no gaps, no borders, no text. Opaque image. All are flat orthographic top-down material surfaces with ZERO perspective, no buildings, no objects, no characters, no lamps, no shadows, no road markings. Upper-left quadrant: weathered cool dark slate asphalt, calm medium-small granular painted texture, a few fine cracks, low contrast for readable characters. Upper-right: aged blue-gray exterior concrete slabs with thin joints, very subtle moss in seams, square paving slabs. Lower-left: worn gray-green interior floor tiles, small square tile grid, occasional scuff, low contrast. Lower-right: aged industrial roof sheet, muted blue-gray corrugated metal, regular fine parallel vertical ridges, subtle rust stains. Each quadrant should itself tile approximately seamlessly. Crisp hand-painted game-texture quality with selective pixel grain, matte surfaces, 2D not photorealistic, gentle value variation. Dark slate and desaturated eucalyptus, NOT brown or warm olive. Avoid large landmarks, stains shaped like objects, dramatic lighting, vignettes, extreme noise. This image will be split into four reusable terrain materials in an actual game.

### Background correction, characters and props

Precise background-only edit: preserve exact characters/props, grid layout, scale and detail. Replace all checkerboard/background pixels with a completely flat RGB255,0,255 magenta key color, including gaps between limbs. No checkerboards, gradients, shadows or text. The game engine discards the key at load time.
