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
  base: '/lcards/',

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
      { text: 'Getting Started', link: '/getting-started/what-is-lcards' },
      { text: 'Cards',           link: '/cards/' },
      { text: 'Configuration',   link: '/configuration/' },
      { text: 'Core',            link: '/core/' },
      { text: 'Architecture',    link: '/architecture/systems-arch' },
      { text: 'Developer',       link: '/development/' },
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'What is LCARdS?',           link: '/getting-started/what-is-lcards' },
            { text: 'Installation',               link: '/getting-started/installation' },
            { text: 'Migrating from CB-LCARS',    link: '/getting-started/cb-lcars-migration' },
          ],
        },
      ],

      '/cards/': [
        {
          text: 'Cards',
          items: [
            { text: 'Overview',       link: '/cards/' },
            { text: 'Common Properties', link: '/cards/common' },
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
            { text: 'MSD',            link: '/cards/msd/' },
            { text: 'Select Menu',    link: '/cards/select-menu/' },
            { text: 'Alert Overlay',  link: '/cards/alert-overlay/' },
          ],
        },
      ],

      '/configuration/': [
        {
          text: 'Configuration',
          items: [
            { text: 'Overview',           link: '/configuration/' },
            { text: 'Config Panel',       link: '/configuration/config-panel' },
            { text: 'Themes & Colours',   link: '/configuration/themes-colours' },
            { text: 'Presets',            link: '/configuration/presets' },
            { text: 'Persistent Helpers', link: '/configuration/persistent-helpers' },
            { text: 'Validation',         link: '/configuration/validation' },
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
            { text: 'Actions',        link: '/core/actions' },
            { text: 'Text Fields',    link: '/core/text-fields' },
            { text: 'Sounds',         link: '/core/sounds' },
          ],
        },
        {
          text: 'Singleton Systems',
          collapsed: false,
          items: [
            { text: 'Templates',     link: '/core/templates/' },
            { text: 'Data Sources',  link: '/core/datasources/' },
            { text: 'Rules Engine',  link: '/core/rules/' },
            { text: 'Themes',        link: '/core/themes/' },
            { text: 'Animations',    link: '/core/animations' },
          ],
        },
        {
          text: 'Effects',
          collapsed: true,
          items: [
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
            { text: 'Card Foundation', link: '/architecture/cards/lcards-card-foundation' },
          ],
        },
        {
          text: 'Animations',
          collapsed: false,
          items: [
            { text: 'Overview',               link: '/architecture/animations/' },
            { text: 'DataSource Buffers',     link: '/architecture/animations/datasource-buffers' },
            { text: 'Entity Change Triggers', link: '/architecture/animations/entity-change-triggers' },
            { text: 'Rule-based Animations',  link: '/architecture/animations/rule-based-animations' },
          ],
        },
        {
          text: 'Subsystems',
          collapsed: false,
          items: [
            { text: 'Pack System',            link: '/architecture/subsystems/pack-system' },
            { text: 'Sound System',           link: '/architecture/subsystems/sound-system' },
            { text: 'Background Animations',  link: '/architecture/subsystems/background-animation-system' },
            { text: 'Shape & Texture System', link: '/architecture/subsystems/shape-texture-system' },
          ],
        },
      ],

      '/development/': [
        {
          text: 'Developer Guide',
          items: [
            { text: 'Overview',     link: '/development/' },
            { text: 'Custom Card',  link: '/development/custom-card' },
            { text: 'Helpers API',  link: '/development/helpers-api' },
            { text: 'Contributing', link: '/development/contributing' },
            { text: 'Changelog',    link: '/development/changelog' },
            { text: 'Credits',      link: '/credits' },
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
      message: 'Released under the MIT License.',
      copyright: '© 2026 snootched | LCARdS',
    },

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
    },
  },
}))
