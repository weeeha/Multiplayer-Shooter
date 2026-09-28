# Cold Relay — After the Signal

Original 48-second stereo ambient composition synthesized for this prototype. No third-party recordings, melodies or samples were used. The deterministic source is `tools/build-ambient-music.py`; `provenance.json` records format, levels and SHA-256.

A low industrial hum, overlapping minor/suspended pads, soft breathing pulses and sparse bell tones leave room for combat and footsteps. Voices and envelopes wrap through the 48-second boundary; the generated PCM loop requires no extra leading/trailing silence or compressed-audio padding.

Playback uses one looping Web Audio source on a separate quiet gain bus. Default setting is 20%; the Field Menu slider ranges from Off to 100% and is saved locally. Playback starts only after entering the game, fades on volume/focus changes and keeps one source through restarts. Loading failure does not prevent gameplay. Original PCM is stereo, 24 kHz, 16-bit.
