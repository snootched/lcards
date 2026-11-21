// The config checker page's samples (ConfigChecker.vue), in their own module so the
// page can show them without loading the checker. tests/docs/config-checker.test.js
// checks that the broken one reports exactly its mistakes and the fixed one is clean.

/** A button with five typical mistakes (the page's "Try a broken example"). */
export const BROKEN_SAMPLE = `type: custom:lcards-button
entity: light.kitchen
preset: lozenge-rigth
text:
  label:
    content: Kitchen Lights
    colour: white
style:
  card:
    color:
      background:
        active: colors.alert.red
        inactive: theme:colors.status.sucess
animations:
  - trigger: on_tap
    preset: pulsee
tap_action:
  action: toggle
`

/** BROKEN_SAMPLE with every mistake fixed. */
export const FIXED_SAMPLE = `type: custom:lcards-button
entity: light.kitchen
preset: lozenge-right
text:
  label:
    content: Kitchen Lights
    color: white
style:
  card:
    color:
      background:
        active: theme:colors.alert.red
        inactive: theme:colors.status.success
animations:
  - trigger: on_tap
    preset: pulse
tap_action:
  action: toggle
`

/** What each mistake in BROKEN_SAMPLE is, shown beside the before/after pair. */
export const SAMPLE_FIXES = [
  { path: 'preset', fix: 'A typo in the preset name.' },
  { path: 'text.label.colour', fix: 'Option names use American spelling: color.' },
  { path: 'style.card.color.background.active', fix: 'Theme colours need the theme: prefix.' },
  { path: 'style.card.color.background.inactive', fix: 'A typo in the theme colour name.' },
  { path: 'animations[0].preset', fix: 'A typo in the animation name.' },
]
