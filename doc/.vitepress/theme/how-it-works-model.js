// What the "How LCARdS works" diagram shows (HowItWorks.vue): the boxes in each
// band with a plain sentence and a docs link, which boxes each one works with
// (clicking a box lights those up), and the scenarios that walk a change through
// the system step by step. tests/docs/docs-links.test.js checks every link, and
// that every connection and scenario step names a real box.

export const BANDS = [
  {
    id: 'ha',
    title: 'Home Assistant',
    note: 'Where your data lives',
    boxes: [
      { id: 'entities', label: 'Entities & states', text: 'Lights, sensors, switches and helpers. When a state changes, every card that shows it updates on its own.', link: '/core/colours' },
      { id: 'history', label: 'History', text: 'Past values and long-term statistics, for charts and smoothed readings.', link: '/cards/chart/series' },
      { id: 'services', label: 'Services & automations', text: 'What makes things happen: a light turning on, an automation, a script or a voice command. They can call LCARdS actions too.', link: '/configuration/ha-actions' },
      { id: 'yaml', label: 'Your dashboard', text: 'Your cards, set up in the card editors or as YAML. The editors and the config checker keep it valid.', link: '/getting-started/building-dashboards' },
    ],
  },
  {
    id: 'core',
    title: 'LCARdS core',
    note: 'Shared by every card on the screen',
    boxes: [
      { id: 'themes', label: 'Themes', text: 'One set of LCARS colours, fonts and sizes for every card, so the whole screen looks like one system.', link: '/core/themes/' },
      { id: 'rules', label: 'Rules', text: 'Change the look of any card when something happens: "if the door is open, turn these buttons red".', link: '/core/rules/' },
      { id: 'datasources', label: 'Data sources', text: 'Keep recent values of a sensor and process them (smooth, average, min/max) for text and charts.', link: '/core/datasources/' },
      { id: 'templates', label: 'Templates', text: 'Put live values into text: a temperature in a label, a status in a grid cell.', link: '/core/templates/' },
      { id: 'animations', label: 'Animations & sounds', text: 'Pulses, cascades, line draws and LCARS beeps, on tap or when a state changes.', link: '/core/animations' },
      { id: 'alert', label: 'Alert mode', text: 'Red, yellow or blue alert repaints every card at once, and can play a sound and show an overlay.', link: '/core/alert-mode' },
      { id: 'effects', label: 'Screen effects', text: 'Full-screen layers (blur, tint, static, glitch), pop-up portal cards, the connection overlay and the Borg.', link: '/core/effects/screen-effects' },
    ],
  },
  {
    id: 'cards',
    title: 'Cards',
    note: 'What you put on the screen',
    boxes: [
      { id: 'button', label: 'Button', text: 'LCARS buttons, labels and multi-part controls like the D-pad.', link: '/cards/button/' },
      { id: 'elbow', label: 'Elbow', text: 'The corner frames that give LCARS its shape.', link: '/cards/elbow/' },
      { id: 'slider', label: 'Slider', text: 'Bars and gauges to show or set a value.', link: '/cards/slider-card/' },
      { id: 'chart', label: 'Chart', text: 'History and live data as lines, areas, bars and more.', link: '/cards/chart/' },
      { id: 'grid', label: 'Data grid', text: 'Tables of live values, or decorative number cascades.', link: '/cards/data-grid/' },
      { id: 'select', label: 'Select menu', text: 'A grid of buttons to pick one option.', link: '/cards/select-menu/' },
      { id: 'msd', label: 'MSD', text: 'A ship display with controls joined by routed lines.', link: '/cards/msd/' },
      { id: 'overlay', label: 'Alert overlay', text: 'The full-screen symbol and backdrop shown during an alert.', link: '/cards/alert-overlay/' },
      { id: 'layout', label: 'Layout', text: 'Grids that place cards on the screen: the layout view and layout card.', link: '/cards/layout-card/' },
    ],
  },
]

export const BACKEND = {
  id: 'backend',
  title: 'LCARdS integration',
  note: 'Runs inside Home Assistant itself',
  boxes: [
    { id: 'actions', label: 'Actions', text: 'lcards.red_alert, lcards.play_sound and more: call them from automations, scripts or voice.', link: '/configuration/ha-actions' },
    { id: 'helpers', label: 'Helpers', text: 'Home Assistant helpers LCARdS uses, such as the alert mode, created for you in one click.', link: '/configuration/persistent-helpers' },
    { id: 'settings', label: 'Settings & panel', text: 'The LCARdS config panel: theme, sounds, users and devices, saved in Home Assistant.', link: '/configuration/' },
  ],
}

// What each box works with. Clicking a box lights up these (and the boxes that list
// it), so a card shows the services and data behind it, and a service its cards.
const CARD_CORE = ['yaml', 'themes', 'rules', 'templates', 'animations', 'alert']
export const CONNECTIONS = {
  button: ['entities', 'services', ...CARD_CORE],
  elbow: ['entities', 'services', ...CARD_CORE],
  slider: ['entities', 'services', ...CARD_CORE],
  chart: ['entities', 'history', 'datasources', 'yaml', 'themes', 'alert'],
  grid: ['entities', 'datasources', ...CARD_CORE],
  select: ['entities', 'services', ...CARD_CORE],
  msd: ['entities', 'services', 'datasources', ...CARD_CORE],
  overlay: ['helpers', 'alert', 'themes', 'animations', 'yaml'],
  layout: ['yaml', 'themes'],
  rules: ['entities', 'datasources'],
  datasources: ['entities', 'history'],
  templates: ['entities', 'datasources'],
  animations: ['entities', 'settings'],
  alert: ['helpers', 'actions', 'themes', 'settings'],
  effects: ['actions', 'settings', 'themes'],
  themes: ['settings'],
  actions: ['services', 'helpers'],
  helpers: ['entities'],
}

/** Boxes connected to `id`, in either direction. */
export function connected(id) {
  const out = new Set(CONNECTIONS[id] ?? [])
  for (const [from, to] of Object.entries(CONNECTIONS)) if (to.includes(id)) out.add(from)
  out.delete(id)
  return [...out]
}

/** Scenarios: each step lights up boxes and says what happens. */
export const EXAMPLES = [
  {
    id: 'light',
    label: 'A light turns on',
    steps: [
      { boxes: ['entities'], text: 'light.kitchen turns on in Home Assistant.' },
      { boxes: ['button', 'themes'], text: 'Its button switches to its "on" colour, taken from the theme. No reload.' },
      { boxes: ['rules', 'elbow', 'msd'], text: 'A rule watching the same light restyles other cards too: the frame and the ship display light up.' },
      { boxes: ['animations', 'button'], text: 'An animation set to run on state changes pulses the button.' },
    ],
  },
  {
    id: 'tap',
    label: 'You tap a button',
    steps: [
      { boxes: ['button', 'animations'], text: 'You tap the button: it plays an LCARS beep (and its tap animation, if it has one).' },
      { boxes: ['services'], text: 'Its tap action calls a Home Assistant service, e.g. light.toggle.' },
      { boxes: ['entities'], text: 'Home Assistant switches the light and reports the new state.' },
      { boxes: ['button', 'themes'], text: 'The button repaints in its "on" colour: what you see always follows the real state.' },
    ],
  },
  {
    id: 'alert',
    label: 'Red alert',
    steps: [
      { boxes: ['services', 'actions'], text: 'An automation (or a button) calls lcards.red_alert.' },
      { boxes: ['helpers'], text: 'The alert mode helper switches to red_alert, so every open screen hears about it.' },
      { boxes: ['alert', 'themes'], text: 'Alert mode shifts the theme palette to reds.' },
      { boxes: ['button', 'elbow', 'slider', 'chart', 'grid', 'select', 'msd', 'animations'], text: 'Every card repaints at once and an alert sound can play.' },
      { boxes: ['overlay'], text: 'The alert overlay covers the screen with the red alert symbol.' },
    ],
  },
  {
    id: 'chart',
    label: 'A smoothed reading',
    steps: [
      { boxes: ['entities', 'history'], text: 'A temperature sensor reports a new value; its history is already loaded.' },
      { boxes: ['datasources'], text: 'A data source keeps the recent values and smooths them.' },
      { boxes: ['templates', 'button'], text: 'A label shows the smoothed value, e.g. "DECK 21.4 °C".' },
      { boxes: ['chart'], text: 'A chart draws the raw and smoothed lines from the same data source.' },
    ],
  },
  {
    id: 'sound',
    label: 'A voice command',
    steps: [
      { boxes: ['services'], text: 'You ask your voice assistant to sound the arrival chime.' },
      { boxes: ['actions'], text: 'Its script calls lcards.play_sound, aimed at the bridge tablet.' },
      { boxes: ['settings'], text: 'LCARdS knows which device is the bridge tablet and whether its sounds are on.' },
      { boxes: ['animations'], text: 'The chime plays on that screen only.' },
    ],
  },
  {
    id: 'spike',
    label: 'A power spike',
    steps: [
      { boxes: ['entities'], text: 'The engine room power sensor jumps above 3 kW.' },
      { boxes: ['rules'], text: 'A rule with a condition "above 3000" matches.' },
      { boxes: ['msd', 'elbow', 'grid'], text: 'It restyles every card it targets at once: the ship display\'s engine lines, the frame and the status table turn red.' },
      { boxes: ['animations', 'msd'], text: 'A rule-based animation pulses the lines, and stops on its own when power drops back.' },
    ],
  },
  {
    id: 'console',
    label: 'A warning on one screen',
    steps: [
      { boxes: ['entities', 'services'], text: 'A door sensor trips at night and an automation runs.' },
      { boxes: ['actions'], text: 'It calls lcards.show_portal_card with a warning card, aimed at the security console.' },
      { boxes: ['settings'], text: 'LCARdS knows which browser is the security console (Users & Devices).' },
      { boxes: ['effects'], text: 'That screen blurs and shows the warning card. Every other screen carries on as normal.' },
    ],
  },
  {
    id: 'offline',
    label: 'The connection drops',
    steps: [
      { boxes: ['entities', 'history', 'services', 'yaml'], text: 'A kiosk tablet loses its connection to Home Assistant: no more state updates.' },
      { boxes: ['effects', 'settings'], text: 'After a short grace period LCARdS covers the screen with the connection overlay, styled in the Connectivity settings, so a stale dashboard is never mistaken for a live one.' },
      { boxes: ['entities', 'button', 'elbow', 'slider', 'chart', 'grid', 'select', 'msd'], text: 'When the connection returns, the overlay clears and every card catches up with the latest states.' },
    ],
  },
  {
    id: 'borg',
    label: 'Borg assimilation',
    steps: [
      { boxes: ['services', 'actions'], text: 'An automation (or a brave button) calls lcards.borg_assimilate.' },
      { boxes: ['effects'], text: 'Injection sites glow and tendrils spread across the screen.' },
      { boxes: ['themes', 'button', 'elbow', 'slider', 'chart', 'grid', 'select', 'msd'], text: 'The palette shifts to Borg green and every card switches to the Borg typeface.' },
      { boxes: ['actions', 'effects'], text: 'lcards.borg_deassimilate plays a glitch and restores everything. Resistance was not futile.' },
    ],
  },
]

/** Every box, by id. */
export const ALL_BOXES = Object.fromEntries([...BANDS.flatMap(b => b.boxes), ...BACKEND.boxes].map(b => [b.id, b]))
