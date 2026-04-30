# HODL Idle Clicker Tight-Sliced Asset Pack

This pack replaces the previous grouped/poster-style assets.

Use these individual PNGs in Phaser/React:
- rooms/: 3 room tiers
- slots/: empty, available, locked, occupied
- objects/: individual decor objects
- ui/: individual panels/cards/bars
- buttons/: individual buttons
- icons/: individual icons
- effects/: tap/coin/diamond effects
- branding/: HODL logo/crown
- reference/: original source sheet only for visual reference

Important:
- Most sprite/gameplay assets are tight-cropped transparent PNGs.
- UI panel PNGs intentionally preserve their dark panel backgrounds.
- Players start with NO homie. Game should remain playable with empty slots.
- Use slot_positions.json for initial hardcoded homie/slot placement.

Recommended Hermes instruction:
Do not render source_asset_sheet.png. Use only sliced assets from the folders above.


## FINAL HERMES NOTES

This final pack now includes the original Homie character supplied by UncleHODL.

Use:
- `character/homie_player_idle.png` for the main tappable character.
- Do NOT use a robot placeholder.
- Do NOT render `reference/source_asset_sheet.png`.
- For room level 1, render only 5 slots, not all 20.
- Room level capacities:
  - Level 1 = 5
  - Level 2 = 10
  - Level 3 = 20

Recommended first scene:
1. Render `rooms/room_lvl_1_starter.png`.
2. Render 5 `slots/slot_empty.png` markers using the first 5 coordinates from `slot_positions.json`.
3. Render `character/homie_player_idle.png` centered above the slots.
4. Use React HTML/CSS for UI panels if Phaser placement is messy.
