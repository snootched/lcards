import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import { readFileSync } from 'node:fs'

const SITE_URL = 'https://lcards.unimatrix01.ca'
const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'))

/**
 * markdown-it core rule: wrap {{ ... }} in <span v-pre> so Vue's
 * template compiler doesn't try to interpret them as interpolations.
 * Needed because LCARdS docs show Jinja2 / HA template syntax in prose.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function vPreBracesRule(md: any) {
  // 1. Patch code_inline renderer: add v-pre so Vue skips interpolation inside <code>
  md.renderer.rules.code_inline = (tokens: any[], idx: number) => {
    const token = tokens[idx]
    const escaped = md.utils.escapeHtml(token.content)
    return `<code v-pre>${escaped}</code>`
  }

  // 2. Core rule: wrap bare {{ ... }} in prose text with <span v-pre>
  md.core.ruler.push('v_pre_braces', (state: any) => {
    for (const blockToken of state.tokens) {
      if (blockToken.type !== 'inline' || !blockToken.children) continue
      const out: any[] = []
      for (const child of blockToken.children) {
        if (child.type !== 'text' || !child.content.includes('{{')) {
          out.push(child)
          continue
        }
        const parts = (child.content as string).split(/({{[\s\S]*?}})/g)
        for (const part of parts) {
          if (!part) continue
          const t = Object.assign(Object.create(Object.getPrototypeOf(child)), child)
          if (part.startsWith('{{')) {
            t.type    = 'html_inline'
            t.content = `<span v-pre>${part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`
          } else {
            t.type    = 'text'
            t.content = part
          }
          out.push(t)
        }
      }
      blockToken.children = out
    }
  })
}

export default withMermaid(defineConfig({
  title: 'LCARdS',
  description: 'LCARS-inspired card components for Home Assistant',
  // Custom domain (lcards.unimatrix01.ca) — GitHub Pages serves from root, no subpath needed
  base: '/',

  ignoreDeadLinks: false,

  // Default to dark mode (matches LCARS aesthetic)
  appearance: 'dark',

  // Output goes to doc/.vitepress/dist (VitePress default — consistent across environments)

  sitemap: {
    hostname: SITE_URL,
  },

  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Antonio:wght@400;600;700&display=swap'
    }],
    // Plausible init block
    [
      'script',
      {
        async: '',
        src: 'https://plausible.io/js/pa-78zuO-ZL5IQCS6WOAhRja.js'
      }
    ],
    // Plausible init block
    [
      'script',
      {},
      `
        window.plausible = window.plausible || function() {
          (plausible.q = plausible.q || []).push(arguments)
        };
        plausible.init = plausible.init || function(i) {
          plausible.o = i || {};
        };
        plausible.init();
      `
    ]
  ],

  // ── Mermaid config ────────────────────────────────────────────────────────
  mermaid: {
    // theme is controlled via CSS variables in the custom theme
  },

  // ── Markdown config ───────────────────────────────────────────────────────
  markdown: {
    config(md) {
      tabsMarkdownPlugin(md)
      vPreBracesRule(md)
    },
  },

  // ── Vite config ───────────────────────────────────────────────────────────
  // AnimationPlayground.vue dynamically imports the real src/core/packs/animations
  // preset modules (so docs demos never drift from shipped behaviour). Those
  // modules reference __LCARDS_VERSION__, normally injected by the app's own
  // vite.config.js — redefine it here so the docs client bundle resolves it too.
  vite: {
    define: {
      __LCARDS_VERSION__: JSON.stringify(pkg.version),
    },
  },

  themeConfig: {
    siteTitle: 'LCARdS',

    nav: [
      {
        text: 'Getting Started',
        activeMatch: '/getting-started/',
        items: [
          { text: 'What is LCARdS?',      link: '/getting-started/what-is-lcards' },
          { text: 'Installation',          link: '/getting-started/installation' },
          { text: 'Coming from CB-LCARS', link: '/getting-started/cb-lcars-migration' },
        ],
      },
      {
        text: 'Configuration',
        activeMatch: '/configuration/',
        items: [
          { text: 'Overview & Setup',  link: '/configuration/' },
          { text: 'HA-LCARS Theme Profiles', link: '/configuration/ha-lcars-theme-profiles' },
          { text: 'Alert Mode Lab',    link: '/configuration/alert-mode-lab' },
          { text: 'Connectivity',      link: '/configuration/connectivity' },
          { text: 'Helpers',           link: '/configuration/persistent-helpers' },
          { text: 'Sounds',            link: '/configuration/sounds' },
          { text: 'Users & Devices',   link: '/configuration/users-devices' },
          { text: 'HA Actions',         link: '/configuration/ha-actions' },
          { text: 'Using browser_mod', link: '/configuration/browser-mod' },
        ],
      },
      {
        text: 'Cards',
        activeMatch: '/cards/',
        items: [
          {
            text: 'Cards',
            items: [
              { text: 'Overview',          link: '/cards/' },
              { text: 'Common Properties', link: '/cards/common' },
              { text: 'Main Engineering',  link: '/cards/main-engineering' },
            ],
          },
          {
            text: 'Card Reference',
            items: [
              { text: 'Alert Overlay', link: '/cards/alert-overlay/' },
              { text: 'Button',        link: '/cards/button/' },
              { text: 'Chart',         link: '/cards/chart/' },
              { text: 'Data Grid',     link: '/cards/data-grid/' },
              { text: 'Elbow',         link: '/cards/elbow/' },
              { text: 'Layout View',   link: '/cards/layout-view/' },
              { text: 'MSD',           link: '/cards/msd/' },
              { text: 'Select Menu',   link: '/cards/select-menu/' },
              { text: 'Slider',        link: '/cards/slider-card/' },
            ],
          },
          {
            text: 'Card Features',
            items: [
              { text: 'Actions',           link: '/core/actions' },
              { text: 'Animations',        link: '/core/animations' },
              { text: 'Colours',           link: '/core/colours' },
              { text: 'Data Sources',      link: '/core/datasources/' },
              { text: 'Presets',           link: '/core/presets' },
              { text: 'Rules Engine',      link: '/core/rules/' },
              { text: 'Sounds',            link: '/core/sounds' },
              { text: 'Styles',            link: '/core/styles' },
              { text: 'Templates',         link: '/core/templates/' },
              { text: 'Text Fields',       link: '/core/text-fields' },
            ],
          },
        ],
      },
      {
        text: 'Core',
        activeMatch: '/core/',
        items: [
          {
            text: 'Per-Card Options',
            items: [
              { text: 'Overview',    link: '/core/' },
              { text: 'Actions',     link: '/core/actions' },
              { text: 'Colours',     link: '/core/colours' },
              { text: 'Presets',     link: '/core/presets' },
              { text: 'Sounds',      link: '/core/sounds' },
              { text: 'Styles',      link: '/core/styles' },
              { text: 'Text Fields', link: '/core/text-fields' },
            ],
          },
          {
            text: 'Core Services',
            items: [
              { text: 'Data Sources', link: '/core/datasources/' },
              { text: 'Rules Engine', link: '/core/rules/' },
              { text: 'Templates',    link: '/core/templates/' },
              { text: 'Themes',       link: '/core/themes/' },
            ],
          },
          {
            text: 'Effects',
            items: [
              { text: 'Alert Mode',            link: '/core/alert-mode' },
              { text: 'Animations',            link: '/core/animations' },
              { text: 'Background Animations', link: '/core/effects/background-animations' },
              { text: 'Borg Assimilation',     link: '/core/borg' },
              { text: 'Filters',               link: '/core/effects/filters' },
              { text: 'Screen Effects',        link: '/core/effects/screen-effects' },
            ],
          },
        ],
      },
      {
        text: 'Architecture',
        activeMatch: '/architecture/',
        items: [
          { text: 'Systems Overview',   link: '/architecture/systems-arch' },
          { text: 'HA Integration',     link: '/architecture/ha-integration' },
          { text: 'Card Foundation',    link: '/architecture/cards/lcards-card-foundation' },
          { text: 'Layout View',        link: '/architecture/layout-view' },
          { text: 'MSD Pipeline',       link: '/architecture/msd/' },
          { text: 'Animation Architecture', link: '/architecture/animations/' },
          { text: 'Core Subsystems →',       link: '/architecture/subsystems/' },
          { text: 'Internals →',             link: '/architecture/internals/' },
        ],
      },
      {
        text: 'Developer',
        activeMatch: '/development/',
        items: [
          {
            text: 'Guide',
            items: [
              { text: 'Overview',         link: '/development/' },
              { text: 'Custom Card',      link: '/development/custom-card' },
              { text: 'Colour Resolution',        link: '/development/colour-resolution' },
              { text: 'Building an Editor', link: '/development/building-an-editor' },
              { text: 'Building a Pack',  link: '/development/building-a-pack' },
            ],
          },
          {
            text: 'API Reference',
            items: [
              { text: 'Animation API',    link: '/development/anim-api' },
              { text: 'Assets API',       link: '/development/assets-api' },
              { text: 'Backend WS API',   link: '/development/backend-api' },
              { text: 'Debug API',        link: '/development/debug-api' },
              { text: 'Helpers API',      link: '/development/helpers-api' },
            ],
          },
          {
            text: 'CSS & Theming',
            items: [
              { text: 'HA CSS Variables', link: '/development/ha-css-vars' },
            ],
          },
          {
            text: 'Internals',
            items: [
              { text: 'Codebase Review', link: '/dev/codebase-review' },
            ],
          },
        ],
      },
      { text: 'About', link: '/credits' },
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'What is LCARdS?',           link: '/getting-started/what-is-lcards' },
            { text: 'Installation',               link: '/getting-started/installation' },
            { text: 'Coming from CB-LCARS',    link: '/getting-started/cb-lcars-migration' },
          ],
        },
      ],

      '/cards/': [
        {
          text: 'Cards',
          items: [
            { text: 'Overview',          link: '/cards/' },
            { text: 'Common Properties', link: '/cards/common' },
            { text: 'Main Engineering',  link: '/cards/main-engineering' },
          ],
        },
        {
          text: 'Card Reference',
          collapsed: false,
          items: [
            { text: 'Button',         link: '/cards/button/' },
            { text: 'Elbow',          link: '/cards/elbow/' },
            { text: 'Slider',         link: '/cards/slider-card/' },
            { text: 'Chart',          link: '/cards/chart/' },
            { text: 'Data Grid',      link: '/cards/data-grid/' },
            { text: 'Layout View',    link: '/cards/layout-view/' },
            {
              text: 'MSD',
              collapsed: true,
              items: [
                { text: 'Overview',         link: '/cards/msd/' },
                { text: 'Quick Start',      link: '/cards/msd/quick-start' },
                { text: 'Control Overlay',  link: '/cards/msd/control-overlay' },
                { text: 'Line Overlay',     link: '/cards/msd/line-overlay' },
                { text: 'Routing Concepts', link: '/cards/msd/routing-concepts' },
                { text: 'Routing & Channels', link: '/cards/msd/routing' },
                { text: 'Shape Overlay',    link: '/cards/msd/shape-overlay' },
                { text: 'Manual Routing',   link: '/cards/msd/manual-routing' },
                { text: 'Base SVG Filters', link: '/cards/msd/base-svg-filters' },
              ],
            },
            { text: 'Select Menu',    link: '/cards/select-menu/' },
            { text: 'Alert Overlay',  link: '/cards/alert-overlay/' },
          ],
        },
        {
          text: 'Card Features',
          collapsed: false,
          items: [
            { text: 'Actions',               link: '/core/actions' },
            { text: 'Animations',             link: '/core/animations' },
            { text: 'Background Animations',  link: '/core/effects/background-animations' },
            { text: 'Screen Effects',         link: '/core/effects/screen-effects' },
            { text: 'Colours',               link: '/core/colours' },
            { text: 'Data Sources',          link: '/core/datasources/' },
            { text: 'Presets',               link: '/core/presets' },
            { text: 'Rules Engine',          link: '/core/rules/' },
            { text: 'Sounds',                link: '/core/sounds' },
            { text: 'Styles',                link: '/core/styles' },
            { text: 'Templates',             link: '/core/templates/' },
            { text: 'Text Fields',           link: '/core/text-fields' },
          ],
        },
      ],

      '/configuration/': [
        {
          text: 'Configuration',
          items: [
            { text: 'Overview & Setup',  link: '/configuration/' },
            { text: 'HA-LCARS Theme Profiles', link: '/configuration/ha-lcars-theme-profiles' },
            { text: 'Alert Mode Lab',    link: '/configuration/alert-mode-lab' },
            { text: 'Connectivity',      link: '/configuration/connectivity' },
            { text: 'Helpers',           link: '/configuration/persistent-helpers' },
            { text: 'Sounds',            link: '/configuration/sounds' },
            { text: 'Users & Devices',   link: '/configuration/users-devices' },
            { text: 'HA Actions',         link: '/configuration/ha-actions' },
            { text: 'Using browser_mod', link: '/configuration/browser-mod' },
          ],
        },
      ],

      '/core/': [
        {
          text: '← Back to Cards',
          link: '/cards/',
        },
        {
          text: 'Overview',
          link: '/core/',
        },
        {
          text: 'Per-Card Options',
          items: [
            { text: 'Actions',     link: '/core/actions' },
            { text: 'Colours',     link: '/core/colours' },
            { text: 'Presets',     link: '/core/presets' },
            { text: 'Sounds',      link: '/core/sounds' },
            { text: 'Styles',      link: '/core/styles' },
            { text: 'Text Fields', link: '/core/text-fields' },
          ],
        },
        {
          text: 'Core Services',
          collapsed: false,
          items: [
            {
              text: 'Data Sources',
              collapsed: true,
              items: [
                { text: 'Overview',             link: '/core/datasources/' },
                { text: 'Processor Reference',  link: '/core/datasources/processor-reference' },
              ],
            },
            {
              text: 'Rules Engine',
              collapsed: true,
              items: [
                { text: 'Overview',   link: '/core/rules/' },
                { text: 'Conditions', link: '/core/rules/conditions' },
              ],
            },
            {
              text: 'Templates',
              collapsed: true,
              items: [
                { text: 'Overview',    link: '/core/templates/' },
              ],
            },
            {
              text: 'Themes',
              collapsed: true,
              items: [
                { text: 'Overview', link: '/core/themes/' },
                { text: 'HA-LCARS Theme Profiles', link: '/configuration/ha-lcars-theme-profiles' },
              ],
            },
          ],
        },
        {
          text: 'Effects',
          collapsed: false,
          items: [
            { text: 'Alert Mode',        link: '/core/alert-mode' },
            {
              text: 'Animations',
              collapsed: true,
              items: [
                { text: 'Overview',               link: '/core/animations' },
                { text: 'Preset Reference',        link: '/core/animations/preset-reference' },
                { text: 'Entity Change Triggers', link: '/core/animations/entity-change-triggers' },
                { text: 'Rule-based Animations',  link: '/core/animations/rule-based-animations' },
              ],
            },
            {
              text: 'Background Animations',
              collapsed: true,
              items: [
                { text: 'Overview',          link: '/core/effects/background-animations' },
                { text: 'Preset Reference',  link: '/core/effects/background-animations/preset-reference' },
              ],
            },
            { text: 'Borg Assimilation',  link: '/core/borg' },
            { text: 'Filters',            link: '/core/effects/filters' },
            { text: 'Screen Effects',     link: '/core/effects/screen-effects' },
          ],
        },
      ],

      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Systems Overview', link: '/architecture/systems-arch' },
            { text: 'HA Integration',   link: '/architecture/ha-integration' },
          ],
        },
        {
          text: 'Cards',
          collapsed: false,
          items: [
            { text: 'Card Foundation',  link: '/architecture/cards/lcards-card-foundation' },
            { text: 'Layout View',      link: '/architecture/layout-view' },
            { text: 'MSD Pipeline',     link: '/architecture/msd/' },
          ],
        },
        {
          text: 'Animation Architecture',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/architecture/animations/' },
          ],
        },
        {
          text: 'Core Subsystems',
          collapsed: false,
          items: [
            { text: 'Animation Manager',    link: '/architecture/subsystems/animation-manager' },
            { text: 'Asset Manager',        link: '/architecture/subsystems/asset-manager' },
            { text: 'Component Manager',    link: '/architecture/subsystems/component-manager' },
            { text: 'Connection Overlay',   link: '/architecture/subsystems/connection-overlay' },
            { text: 'DataSource System',    link: '/architecture/subsystems/datasource-system' },
            { text: 'Device Identity',      link: '/architecture/subsystems/device-identity' },
            { text: 'Helper Manager',       link: '/architecture/subsystems/helper-manager' },
            { text: 'Integration Service',  link: '/architecture/subsystems/integration-service' },
            { text: 'Pack System',          link: '/architecture/subsystems/pack-system' },
            { text: 'Rules Engine',         link: '/architecture/subsystems/rules-engine' },
            { text: 'Scoped Settings',      link: '/architecture/subsystems/scoped-settings' },
            { text: 'Screen Effect System', link: '/architecture/subsystems/screen-effects' },
            { text: 'Sound System',         link: '/architecture/subsystems/sound-system' },
            { text: 'Style Preset Manager', link: '/architecture/subsystems/style-preset-manager' },
            { text: 'Systems Manager',      link: '/architecture/subsystems/systems-manager' },
            { text: 'Template System',      link: '/architecture/subsystems/template-system' },
            { text: 'Theme System',         link: '/architecture/subsystems/theme-system' },
            { text: 'Validation Service',   link: '/architecture/subsystems/validation-service' },
          ],
        },
        {
          text: 'Internals',
          collapsed: false,
          items: [
            { text: 'Background Animations',  link: '/architecture/internals/background-animation-system' },
            { text: 'DataSource Buffers',     link: '/architecture/internals/datasource-buffers' },
            { text: 'HA Entity Display',      link: '/architecture/internals/ha-entity-display' },
            { text: 'HA Services (internals)', link: '/architecture/internals/ha-services' },
            { text: 'Persistent Storage',     link: '/architecture/internals/storage' },
            { text: 'Shape & Texture System', link: '/architecture/internals/shape-texture-system' },
          ],
        },
      ],

      '/development/': [
        {
          text: 'Developer Guide',
          items: [
            { text: 'Overview',           link: '/development/' },
            { text: 'Custom Card',        link: '/development/custom-card' },
            { text: 'Colour Resolution',  link: '/development/colour-resolution' },
            { text: 'Building an Editor', link: '/development/building-an-editor' },
            { text: 'Building a Pack',    link: '/development/building-a-pack' },
          ],
        },
        {
          text: 'API Reference',
          collapsed: false,
          items: [
            { text: 'Animation API',    link: '/development/anim-api' },
            { text: 'Assets API',       link: '/development/assets-api' },
            { text: 'Backend WS API',   link: '/development/backend-api' },
            { text: 'Debug API',        link: '/development/debug-api' },
            { text: 'Helpers API',      link: '/development/helpers-api' },
          ],
        },
        {
          text: 'CSS & Theming',
          collapsed: false,
          items: [
            { text: 'HA CSS Variables', link: '/development/ha-css-vars' },
          ],
        },
        {
          text: 'Internals',
          collapsed: false,
          items: [
            { text: 'Codebase Review',  link: '/dev/codebase-review' },
          ],
        },
      ],

      '/dev/': [
        {
          text: 'Internals',
          items: [
            { text: 'Codebase Review', link: '/dev/codebase-review' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/snootched/lcards' },
    ],

    editLink: {
      pattern: 'https://github.com/snootched/lcards/blob/main/doc/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License. | <a href="/credits">License &amp; Disclaimer</a>',
      copyright: '© 2026 snootched | LCARdS | <a href="/credits">About &amp; Credits</a>',
    },

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
    },
  },
}))
