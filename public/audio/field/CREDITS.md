# Cold Relay field audio

All source packs below are released under CC0. Selection, editing and mixing are original to this prototype. Source recordings were downloaded on 2026-09-10. Each shipped sample has its source filename, trim, additional filters, and source/output SHA-256 in `provenance.json`. `tools/build-field-audio.py` reproduces the conversion from unpacked files in the ignored `output/audio-sources` directory.

| Cues | Source and creator | License |
|---|---|---|
| Pistol, AR, shotgun, railgun transient layers | [The Free Firearm Sound Library](https://opengameart.org/content/the-free-firearm-sound-library), Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney | CC0 |
| Railgun charge and electromagnetic discharge layers | Original deterministic synthesis for Cold Relay | Original |
| Reloads, equipment handling, grenade handling | [Gun reload sounds](https://opengameart.org/content/gun-reload-sounds), SpringySpringo | CC0 |
| Dog bite/snarl | [Dog Snarl Grunt Grumble](https://opengameart.org/content/dog-snarl-grunt-grumble), qubodup | CC0 |
| Dog death whine | [Dog sounds](https://opengameart.org/content/dog-sounds), pauliuw | CC0 |
| Zombie death voices | [Zombie moans](https://opengameart.org/content/zombie-moans), Darsycho | CC0 |
| Scavenger death voices | [Grunts of male death and pain](https://opengameart.org/content/grunts-male-death-and-pain), thebardofblasphemy | CC0 |
| Grenade explosion | [Chunky Explosion](https://opengameart.org/content/chunky-explosion), Joth | CC0 |
| Flesh/metal/surface impacts, concrete/grass/metal steps, door thunks, robot collapse | [Impact Sounds](https://kenney.nl/assets/impact-sounds), Kenney | CC0 |

The primary weapon reports are real firearm recordings: Walther PPQ, AR-15 and Mossberg. Railgun discharges combine processed firearm transients with original synthesized pressure, coil and energized-tail layers. The spider uses a deeper, longer variant; its warning charge is fully synthesized and timed to the 1.2-second gameplay telegraph. Handling comes from recorded airsoft mechanisms. Creature voices are performed/recorded effects; metal collapse, rail weapons and the explosion are designed effects, not recordings of fictional machines. The dog whines come from the pack's ordinary dog recordings.

Conversion: select individual reports/performances, high-pass 65 Hz, low-pass 11 kHz, optional denoise/pitch/tempo processing, trim leading silence, normalize to -20 LUFS / -3 dBTP, short fades, mono 24 kHz PCM WAV. Railgun composites use a controlled -17 to -16 LUFS target and -2 dB true-peak ceiling before the in-game limiter. In-game playback adds subtle pitch variation, spatial panning, distance attenuation, gain limiting and a 24-voice cap. Procedural samples remain as a loading/failure fallback for the original combat cues.
