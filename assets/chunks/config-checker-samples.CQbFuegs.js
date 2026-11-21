const t=`type: custom:lcards-button
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
`,e=`type: custom:lcards-button
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
`,o=[{path:"preset",fix:"A typo in the preset name."},{path:"text.label.colour",fix:"Option names use American spelling: color."},{path:"style.card.color.background.active",fix:"Theme colours need the theme: prefix."},{path:"style.card.color.background.inactive",fix:"A typo in the theme colour name."},{path:"animations[0].preset",fix:"A typo in the animation name."}];export{t as B,e as F,o as S};
