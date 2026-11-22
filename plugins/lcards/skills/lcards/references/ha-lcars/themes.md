# HA-LCARS themes

From [HA-LCARS](https://github.com/th3jesta/ha-lcars) at commit `0c4ce18` (2026-09-21), MIT (c) Jesse Wisener. The themes HA-LCARS installs and the colour each puts behind the main role variables.

## Selecting a theme

A user picks one in **Profile > Themes**, or an automation sets it for everyone: `action: frontend.set_theme` with `data: { name: "LCARS Default" }` (the name exactly as below; `mode: dark` or `light` optional). The `(Red Alert)`, `(Yellow Alert)` and `(Blue Alert)` themes are separate themes to switch to. LCARdS alert mode (`lcards.red_alert`, `references/docs/core/alert-mode.md`) is different: it shifts the colours of the current theme in place, plays the alert sound and drives alert overlays, without changing the selected theme. The two `[LCARdS ...]` themes map HA-LCARS and Home Assistant colours onto the LCARdS palette (`references/docs/configuration/ha-lcars-theme-profiles.md`); recommend them to LCARdS users who have no theme preference.

## Role colours by theme

Resolved through the palette where the value is a palette variable (dark mode).

| Theme | ui-primary | ui-secondary | ui-tertiary | ui-quaternary | card-top-color | card-mid-color | card-button-color | card-bottom-color |
|---|---|---|---|---|---|---|---|---|
| LCARS 25C | lcars-primary-gray #6d748c | lcars-medium-gray #B6B6C1 | lcars-alt-orange #e7442a | lcars-primary-gray #6d748c | lcars-alt-dark-gray #2f3749 | lcars-primary-gray #6d748c | lcars-medium-gray #B6B6C1 | lcars-alt-dark-gray #2f3749 |
| LCARS 25C (Blue Alert) | lcars-alert-color #2266ff | lcars-alert-white #dfdfdf | lcars-steel-blue #5588ee | lcars-alert-color #2266ff | lcars-alert-color #2266ff | lcars-alert-color #2266ff | lcars-alert-color #2266ff | lcars-alert-color #2266ff |
| LCARS 25C (Red Alert) | lcars-alert-color #cc0000 | lcars-alert-white #dfdfdf | lcars-maroon #8b0000 | lcars-alert-color #cc0000 | lcars-alert-color #cc0000 | lcars-alert-color #cc0000 | lcars-alert-color #cc0000 | lcars-alert-color #cc0000 |
| LCARS 25C (Yellow Alert) | lcars-alert-color #ffaa00 | lcars-alert-white #dfdfdf | lcars-sunflower #ffcc66 | lcars-alert-color #ffaa00 | lcars-alert-color #ffaa00 | lcars-alert-color #ffaa00 | lcars-alert-color #ffaa00 | lcars-alert-color #ffaa00 |
| LCARS Breen | lcars-green-primary #288855 | lcars-green-secondary #229a6c | lcars-green-tertiary #88de90 | lcars-green-middle #0f5616 | lcars-green-secondary #229a6c | lcars-green-middle #0f5616 | lcars-green-tertiary #88de90 | lcars-green-footer #37bd76 |
| LCARS Cardassia | lcars-green-primary #288855 | lcars-lavender-rose #996699 | lcars-aqua #88ffff | lcars-cardassia-maroon #4f1a23 | lcars-sky-blue #66ccff | lcars-cardassia-maroon #4f1a23 | lcars-cardassia-maroon #4f1a23 | lcars-eggplant #663366 |
| LCARS Classic | lcars-khaki #ffe399 | lcars-khaki #ffe399 | lcars-mars #ff2200 | lcars-gray #666688 | lcars-cool #5588ff | lcars-ice #88ccff | lcars-ice #88ccff | lcars-ice #88ccff |
| LCARS Default | lcars-almond-creme #ffbbaa | lcars-african-violet #cc88ff | lcars-red #dd4444 | lcars-gray #666688 | lcars-bluey #7788ff | lcars-red #dd4444 | lcars-red #dd4444 | lcars-gray #666688 |
| LCARS Kronos | lcars-mars #ff2200 | lcars-gold #ffaa00 | lcars-orange #ff7700 | lcars-deep-maroon #930a00 | lcars-mars #ff2200 | lcars-october-sunset #ff4400 | lcars-october-sunset #ff4400 | lcars-peach #ff8866 |
| LCARS Lower Decks I | lcars-gold #ffaa00 | lcars-butter #ffeecc | lcars-orange #ff7700 | lcars-darkpumpkin #91550b | lcars-october-sunset #ff4400 | lcars-harvestgold #ffaa44 | lcars-harvestgold #ffaa44 | lcars-honey #ffcc99 |
| LCARS Lower Decks II | lcars-gold #ffaa00 | lcars-butter #ffeecc | lcars-orange #ff7700 | lcars-darkpumpkin #91550b | lcars-orange #ff7700 | lcars-taupe #d0b0a0 | lcars-honey #ffcc99 | lcars-vanilla #fff5c7 |
| LCARS Modern | lcars-violet-creme #ddbbff | lcars-sky #aaaaff | lcars-gold #ffaa00 | lcars-gray #666688 | lcars-gold #ffaa00 | lcars-modern-light-gray #9996BA | lcars-gray #666688 | lcars-sky #aaaaff |
| LCARS Navigation | lcars-olive #827A53 | lcars-sand #CDB972 | lcars-lemon #F7EE51 | lcars-olive #827A53 | lcars-khaki-dark #B8A666 | lcars-cornflower #6499FF | lcars-olive #827A53 | lcars-olive #827A53 |
| LCARS Nemesis Blue | lcars-evening #2255ff | lcars-wheat #ccaa88 | lcars-pumpkinshade #ff7744 | lcars-galaxy #444a77 | lcars-sky #aaaaff | lcars-ice #88ccff | lcars-honey #ffcc99 | lcars-cool #5588ff |
| LCARS Picard [LCARdS Blue Accent] | lcards-gray #6d748c | lcards-gray-medium-light #9ea5ba | lcards-blue #37a6d1 | lcards-gray-dark #2f3749 | lcards-gray-medium-dark #52596e | lcards-blue #37a6d1 | lcards-blue #37a6d1 | lcards-gray-dark #2f3749 |
| LCARS Picard [LCARdS Red Accent] | lcards-gray #6d748c | lcards-gray-medium-light #9ea5ba | lcards-orange-medium-dark #e7442a | lcards-gray-dark #2f3749 | lcards-gray-medium-dark #52596e | lcards-orange #ff6753 | lcards-orange #ff6753 | lcards-gray-dark #2f3749 |
| LCARS Picard I | lcars-hellgrau #9FA5BDFF | lcars-mittelgrau #656B83FF | lcars-feuerrot #E7432AFF | lcars-mittelgrau #656B83FF | lcars-mittelgrau #656B83FF | lcars-mango #E5960C | lcars-feuerrot #E7432AFF | lcars-dunkelgrau #30374AFF |
| LCARS Picard II | lcars-turquoise #6efaf9 | lcars-cerulean #21bece | lcars-apricot #e1915c | lcars-midnight-blue #012556 | lcars-beige #e2c599 | lcars-cerulean #21bece | lcars-cerulean #21bece | lcars-midnight-blue #012556 |
| LCARS Red Alert | lcars-cardinal #cc2233 | lcars-silver #dfdfdf | lcars-scarlet #ff0000 | lcars-dark-red #360000 | lcars-brick-red #bf1b1b | lcars-mahogany #9d361e | lcars-muted-coral #d66a60 | lcars-sienna #91311c |
| LCARS Romulus | lcars-green #33cc99 | lcars-african-violet #cc88ff | lcars-orange #ff7700 | lcars-green-middle #0f5616 | lcars-cardinal #cc2233 | lcars-african-violet #cc88ff | lcars-sky #aaaaff | lcars-aqua #88ffff |
| LCARS TNG | lcars-wheat-light #f5deb3 | lcars-sunflower #ffcc66 | lcars-lilac-light #cc99cc | lcars-galaxy #444a77 | lcars-wheat-light #f5deb3 | lcars-antique-gold #c5b358 | lcars-amber #ffbb33 | lcars-wheat-light #f5deb3 |
| LCARS TNGbuttons | lcars-peach-cream #f5cd9f | lcars-sunflower #ffcc66 | lcars-lilac-light #cc99cc | lcars-galaxy #444a77 | lcars-peach-cream #f5cd9f | lcars-honey #ffcc99 | lcars-sunflower #ffcc66 | lcars-warm-gold #efc861 |
| LCARS Transporter | lcars-navy-gray #2C374B | lcars-slate-gray #6E748C | lcars-coral #FA6851 | lcars-navy-gray #2C374B | lcars-charcoal #51596C | lcars-charcoal #51596C | lcars-teal #2A7092 | lcars-navy-gray #2C374B |
| LCARS Zeldaar | lcars-violet-creme #ddbbff | lcars-honey #ffcc99 | lcars-roseblush #cc6666 | lcars-mauve #774477 | lcars-bluey #7788ff | lcars-khaki #ffe399 | lcars-african-violet #cc88ff | lcars-roseblush #cc6666 |

## Helper entities

HA-LCARS reads these helpers (the user creates them). They are ordinary entities: an LCARdS button or slider can control them.

- `input_boolean.lcars_sound` (LCARS Sound): Toggles button and tap sounds
- `input_boolean.lcars_texture` (LCARS Texture): Toggles a grain pattern and backlight effect
- `input_number.lcars_vertical` (LCARS Vertical): Sets the width of vertical borders; Min value: 26; Max value: 60
- `input_number.lcars_horizontal` (LCARS Horizontal): Sets the width of horizontal borders; Min value: 6; Max value: 60
- `input_number.lcars_menu_font` (LCARS Menu Font, optional): Sets the font size (in px) of the sidebar menu
- `sensor.lcars_header` (LCARS Header, optional): Add text to the clock area of the header; Example Template: `{{ "LCARS " + states('sensor.time') }}`
