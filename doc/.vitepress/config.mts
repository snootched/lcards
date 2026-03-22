import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'

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

  // Same pre-existing broken cross-references that MkDocs tolerates.
  // Track and fix separately; don't block CI.
  ignoreDeadLinks: true,

  // Default to dark mode (matches LCARS aesthetic)
  appearance: 'dark',

  // Output goes to doc/.vitepress/dist (VitePress default — consistent across environments)


  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Antonio:wght@400;600;700&display=swap'
    }],
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

  themeConfig: {
    siteTitle: 'LCARdS',

    nav: [
      {
        text: 'Getting Started',
        activeMatch: '/getting-started/',
        items: [
          { text: 'What is LCARdS?',      link: '/getting-started/what-is-lcards' },
          { text: 'Installation',          link: '/getting-started/installation' },
          { text: 'Quick Start',           link: '/getting-started/quick-start' },
          { text: 'Coming from CB-LCARS', link: '/getting-started/cb-lcars-migration' },
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
              { text: 'Button',        link: '/cards/button/' },
              { text: 'Elbow',         link: '/cards/elbow/' },
              { text: 'Slider',        link: '/cards/slider-card/' },
              { text: 'Chart',         link: '/cards/chart/' },
              { text: 'Data Grid',     link: '/cards/data-grid/' },
              { text: 'MSD',           link: '/cards/msd/' },
              { text: 'Select Menu',   link: '/cards/select-menu/' },
              { text: 'Alert Overlay', link: '/cards/alert-overlay/' },
            ],
          },
        ],
      },
      {
        text: 'Configuration',
        activeMatch: '/configuration/',
        items: [
          { text: 'Overview & Setup', link: '/configuration/' },
          { text: 'Config Panel',     link: '/configuration/config-panel' },
          { text: 'Helpers',          link: '/configuration/persistent-helpers' },
          { text: 'Alert Mode Lab',   link: '/configuration/alert-mode-lab' },
          { text: 'Sounds',           link: '/core/sounds' },
        ],
      },
      {
        text: 'Core',
        activeMatch: '/core/',
        items: [
          {
            text: 'Concepts',
            items: [
              { text: 'Overview',    link: '/core/' },
              { text: 'Alert Mode',  link: '/core/alert-mode' },
              { text: 'Colours',     link: '/core/colours' },
              { text: 'Presets',     link: '/core/presets' },
              { text: 'Styles',      link: '/core/styles' },
              { text: 'Actions',     link: '/core/actions' },
              { text: 'Text Fields', link: '/core/text-fields' },
            ],
          },
          {
            text: 'Systems',
            items: [
              { text: 'Templates',    link: '/core/templates/' },
              { text: 'Data Sources', link: '/core/datasources/' },
              { text: 'Rules Engine', link: '/core/rules/' },
              { text: 'Themes',       link: '/core/themes/' },
            ],
          },
          {
            text: 'Effects',
            items: [
              { text: 'Animations',            link: '/core/animations' },
              { text: 'Filters',               link: '/core/effects/filters' },
              { text: 'Background Animations', link: '/core/effects/background-animations' },
            ],
          },
        ],
      },
      {
        text: 'Architecture',
        activeMatch: '/architecture/',
        items: [
          { text: 'Systems Overview',   link: '/architecture/systems-arch' },
          { text: 'Card Foundation',    link: '/architecture/cards/lcards-card-foundation' },
          { text: 'MSD Pipeline',       link: '/architecture/msd/' },
          { text: 'Animation System',   link: '/architecture/animations/' },
          { text: 'DataSource Buffers', link: '/architecture/animations/datasource-buffers' },
          { text: 'Core Subsystems →',  link: '/architecture/subsystems/pack-system' },
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
              { text: 'Animation API',  link: '/development/anim-api' },
              { text: 'Assets API',     link: '/development/assets-api' },
              { text: 'Debug API',      link: '/development/debug-api' },
              { text: 'Helpers API',    link: '/development/helpers-api' },
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
            { text: 'Quick Start',                link: '/getting-started/quick-start' },
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
            {
              text: 'MSD',
              collapsed: true,
              items: [
                { text: 'Overview',         link: '/cards/msd/' },
                { text: 'Control Overlay',  link: '/cards/msd/control-overlay' },
                { text: 'Line Overlay',     link: '/cards/msd/line-overlay' },
                { text: 'Manual Routing',   link: '/cards/msd/manual-routing' },
                { text: 'Bulk Selectors',   link: '/cards/msd/bulk-selectors' },
                { text: 'Base SVG Filters', link: '/cards/msd/base-svg-filters' },
              ],
            },
            { text: 'Select Menu',    link: '/cards/select-menu/' },
            { text: 'Alert Overlay',  link: '/cards/alert-overlay/' },
          ],
        },
      ],

      '/configuration/': [
        {
          text: 'Config Panel',
          items: [
            { text: 'Overview & Setup',  link: '/configuration/' },
            { text: 'Config Panel',      link: '/configuration/config-panel' },
            { text: 'Helpers',           link: '/configuration/persistent-helpers' },
            { text: 'Alert Mode Lab',    link: '/configuration/alert-mode-lab' },
            { text: 'Sounds',            link: '/core/sounds' },
          ],
        },
      ],

      '/core/': [
        {
          text: 'Core Concepts',
          items: [
            { text: 'Overview',       link: '/core/' },
            { text: 'Alert Mode',     link: '/core/alert-mode' },
            { text: 'Colours',        link: '/core/colours' },
            { text: 'Presets',        link: '/core/presets' },
            { text: 'Styles',         link: '/core/styles' },
            { text: 'Actions',        link: '/core/actions' },
            { text: 'Text Fields',    link: '/core/text-fields' },
            { text: 'Sounds',         link: '/core/sounds' },
          ],
        },
        {
          text: 'Systems',
          collapsed: false,
          items: [
            {
              text: 'Templates',
              collapsed: true,
              items: [
                { text: 'Overview',    link: '/core/templates/' },
                { text: 'Conditions',  link: '/core/templates/conditions' },
              ],
            },
            {
              text: 'Data Sources',
              collapsed: true,
              items: [
                { text: 'Overview',             link: '/core/datasources/' },
                { text: 'Processor Reference',  link: '/core/datasources/processor-reference' },
              ],
            },
            { text: 'Rules Engine',  link: '/core/rules/' },
            {
              text: 'Themes',
              collapsed: true,
              items: [
                { text: 'Overview',         link: '/core/themes/' },
                { text: 'Creating Themes',  link: '/core/themes/creating-themes' },
              ],
            },
          ],
        },
        {
          text: 'Effects',
          collapsed: true,
          items: [
            { text: 'Animations',            link: '/core/animations' },
            { text: 'Filters',               link: '/core/effects/filters' },
            { text: 'Background Animations', link: '/core/effects/background-animations' },
          ],
        },
      ],

      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Systems Overview', link: '/architecture/systems-arch' },
          ],
        },
        {
          text: 'Cards',
          collapsed: false,
          items: [
            { text: 'Card Foundation',  link: '/architecture/cards/lcards-card-foundation' },
            { text: 'MSD Pipeline',     link: '/architecture/msd/' },
          ],
        },
        {
          text: 'Animations',
          collapsed: false,
          items: [
            { text: 'Overview',               link: '/architecture/animations/' },
            { text: 'Entity Change Triggers', link: '/architecture/animations/entity-change-triggers' },
            { text: 'Rule-based Animations',  link: '/architecture/animations/rule-based-animations' },
          ],
        },
        {
          text: 'DataSources',
          collapsed: false,
          items: [
            { text: 'DataSource Buffers', link: '/architecture/animations/datasource-buffers' },
          ],
        },
        {
          text: 'Core Subsystems',
          collapsed: false,
          items: [
            { text: 'Animation Manager',      link: '/architecture/subsystems/animation-manager' },
            { text: 'Asset Manager',          link: '/architecture/subsystems/asset-manager' },
            { text: 'Background Animations',  link: '/architecture/subsystems/background-animation-system' },
            { text: 'Component Manager',      link: '/architecture/subsystems/component-manager' },
            { text: 'DataSource System',      link: '/architecture/subsystems/datasource-system' },
            { text: 'Helper Manager',         link: '/architecture/subsystems/helper-manager' },
            { text: 'Pack System',            link: '/architecture/subsystems/pack-system' },
            { text: 'Rules Engine',           link: '/architecture/subsystems/rules-engine' },
            { text: 'Shape & Texture System', link: '/architecture/subsystems/shape-texture-system' },
            { text: 'Sound System',           link: '/architecture/subsystems/sound-system' },
            { text: 'Style Preset Manager',   link: '/architecture/subsystems/style-preset-manager' },
            { text: 'Systems Manager',        link: '/architecture/subsystems/systems-manager' },
            { text: 'Template System',        link: '/architecture/subsystems/template-system' },
            { text: 'Theme System',           link: '/architecture/subsystems/theme-system' },
            { text: 'Validation Service',     link: '/architecture/subsystems/validation-service' },
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
            { text: 'Animation API',  link: '/development/anim-api' },
            { text: 'Assets API',     link: '/development/assets-api' },
            { text: 'Debug API',      link: '/development/debug-api' },
            { text: 'Helpers API',    link: '/development/helpers-api' },
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
