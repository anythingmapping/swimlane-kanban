export type ThemeId = 'stargate' | 'kung-fu-panda' | 'kung-fu-panda-light' | 'nautical' | 'bathymetric' | 'trello' | 'trello-dark' | 'obsidian-native';

export const THEMES: Record<ThemeId, { label: string; tokens: Record<string, string> }> = {
  stargate: {
    label: 'Stargate',
    tokens: {
      // Default — values match styles.less, so no overrides needed.
      // Kept empty: the LESS file already defines these as the fallback.
    },
  },

  'kung-fu-panda': {
    label: 'Kung Fu Panda',
    tokens: {
      // Jade Palace — jade/blue/teal/indigo
      '--sg-gold-bright':       '#5EEAAA',
      '--sg-gold-primary':      '#2A9070',
      '--sg-gold-dark':         '#1A6A4E',
      '--sg-gold-dim':          '#104A38',
      '--sg-gold-glow':         'rgba(94, 234, 170, 0.25)',

      '--sg-surface-void':      '#090E12',
      '--sg-surface-obsidian':  '#0E1418',
      '--sg-surface-stone':     '#101820',
      '--sg-surface-raised':    '#162030',
      '--sg-surface-hover':     '#1C2838',
      '--sg-surface-header':    '#090E12',

      '--sg-bronze':            '#4488CC',
      '--sg-bronze-light':      '#5599DD',

      '--sg-gem-red':           '#C04848',
      '--sg-gem-glow':          '#DA4444',

      '--sg-text-primary':      '#E8F0F0',
      '--sg-text-secondary':    '#8AB8C0',
      '--sg-text-faint':        '#3A5060',
      '--sg-text-gold':         '#5EEAAA',
      '--sg-text-on-gold':      '#060A0E',

      '--sg-status-ok':         '#2A9070',
      '--sg-status-alert':      '#D4920A',
      '--sg-status-critical':   '#C04848',

      '--sg-border-faint':      '#162838',
      '--sg-border-mid':        '#1A3040',
      '--sg-border-gold':       '#1A6A4E',
      '--sg-border-active':     '#5EEAAA',

      '--sg-radius-panel':      '6px',
      '--sg-radius-column':     '6px',
      '--sg-radius-card':       '4px',
      '--sg-radius-badge':      '10px',
      '--sg-radius-btn':        '4px',

      '--sg-font-display':      "'ZCOOL XiaoWei', 'Noto Sans', serif",

      '--sg-card-base':         '#162030',
    },
  },

  'kung-fu-panda-light': {
    label: 'Kung Fu Panda (Light)',
    tokens: {
      // Jade Palace — light variant with cream/parchment backgrounds
      '--sg-gold-bright':       '#1A8A60',
      '--sg-gold-primary':      '#2A9070',
      '--sg-gold-dark':         '#88D4B0',
      '--sg-gold-dim':          '#B0E8D0',
      '--sg-gold-glow':         'rgba(42, 144, 112, 0.20)',

      '--sg-surface-void':      '#F4F1EA',
      '--sg-surface-obsidian':  '#EAE6DC',
      '--sg-surface-stone':     '#E2DECE',
      '--sg-surface-raised':    '#F8F6F0',
      '--sg-surface-hover':     '#D8D4C8',
      '--sg-surface-header':    '#EDE9E0',

      '--sg-bronze':            '#3A78B0',
      '--sg-bronze-light':      '#4A88C0',

      '--sg-gem-red':           '#C04848',
      '--sg-gem-glow':          '#DA4444',

      '--sg-text-primary':      '#2A2A28',
      '--sg-text-secondary':    '#5A6058',
      '--sg-text-faint':        '#A0A098',
      '--sg-text-gold':         '#1A7A55',
      '--sg-text-on-gold':      '#F8F6F0',

      '--sg-status-ok':         '#2A9070',
      '--sg-status-alert':      '#C89020',
      '--sg-status-critical':   '#C04848',

      '--sg-border-faint':      '#D8D4C8',
      '--sg-border-mid':        '#C0BCA8',
      '--sg-border-gold':       '#88D4B0',
      '--sg-border-active':     '#1A8A60',

      '--sg-radius-panel':      '6px',
      '--sg-radius-column':     '6px',
      '--sg-radius-card':       '4px',
      '--sg-radius-badge':      '10px',
      '--sg-radius-btn':        '4px',

      '--sg-font-display':      "'ZCOOL XiaoWei', 'Noto Sans', serif",

      '--sg-card-base':         '#F8F6F0',
    },
  },

  nautical: {
    label: 'Nautical',
    tokens: {
      // Dead Reckoning — parchment/navy/compass gold
      '--sg-gold-bright':       '#C8A050',
      '--sg-gold-primary':      '#C8A050',
      '--sg-gold-dark':         '#6A4A08',
      '--sg-gold-dim':          '#4A3408',
      '--sg-gold-glow':         'rgba(200, 160, 80, 0.25)',

      '--sg-surface-void':      '#0A0E14',
      '--sg-surface-obsidian':  '#0E1420',
      '--sg-surface-stone':     '#101828',
      '--sg-surface-raised':    '#141C2A',
      '--sg-surface-hover':     '#1A2436',
      '--sg-surface-header':    '#0A0E14',

      '--sg-bronze':            '#1A3366',
      '--sg-bronze-light':      '#2A4488',

      '--sg-gem-red':           '#BB4444',
      '--sg-gem-glow':          '#DD5555',

      '--sg-text-primary':      '#D4C8A0',
      '--sg-text-secondary':    '#9A9070',
      '--sg-text-faint':        '#4A4030',
      '--sg-text-gold':         '#C8A050',
      '--sg-text-on-gold':      '#0A0E14',

      '--sg-status-ok':         '#448844',
      '--sg-status-alert':      '#C8A050',
      '--sg-status-critical':   '#BB4444',

      '--sg-border-faint':      '#1A2030',
      '--sg-border-mid':        '#1A2840',
      '--sg-border-gold':       '#6A4A08',
      '--sg-border-active':     '#C8A050',

      '--sg-radius-panel':      '6px',
      '--sg-radius-column':     '6px',
      '--sg-radius-card':       '4px',
      '--sg-radius-badge':      '4px',
      '--sg-radius-btn':        '4px',

      '--sg-font-display':      "system-ui, -apple-system, sans-serif",

      '--sg-card-base':         '#0A0E14',
    },
  },

  bathymetric: {
    label: 'Bathymetric',
    tokens: {
      // Ocean Depths — turquoise/mid-ocean/abyssal navy
      '--sg-gold-bright':       '#40E0D0',
      '--sg-gold-primary':      '#2288AA',
      '--sg-gold-dark':         '#1A3366',
      '--sg-gold-dim':          '#0C1A2A',
      '--sg-gold-glow':         'rgba(64, 224, 208, 0.25)',

      '--sg-surface-void':      '#040810',
      '--sg-surface-obsidian':  '#081018',
      '--sg-surface-stone':     '#0A1420',
      '--sg-surface-raised':    '#0C1420',
      '--sg-surface-hover':     '#0E1824',
      '--sg-surface-header':    '#060C14',

      '--sg-bronze':            '#2288AA',
      '--sg-bronze-light':      '#40C0D0',

      '--sg-gem-red':           '#CC3366',
      '--sg-gem-glow':          '#FF6688',

      '--sg-text-primary':      '#B0C8D8',
      '--sg-text-secondary':    '#5088AA',
      '--sg-text-faint':        '#1A3050',
      '--sg-text-gold':         '#40E0D0',
      '--sg-text-on-gold':      '#040810',

      '--sg-status-ok':         '#1A3366',
      '--sg-status-alert':      '#2288AA',
      '--sg-status-critical':   '#CC3366',

      '--sg-border-faint':      '#0A1828',
      '--sg-border-mid':        '#0C1A2A',
      '--sg-border-gold':       '#1A3366',
      '--sg-border-active':     '#40E0D0',

      '--sg-radius-panel':      '4px',
      '--sg-radius-column':     '4px',
      '--sg-radius-card':       '3px',
      '--sg-radius-badge':      '3px',
      '--sg-radius-btn':        '3px',

      '--sg-font-display':      "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",

      '--sg-card-base':         '#0C1420',
    },
  },

  trello: {
    label: 'Trello',
    tokens: {
      // ── Trello Bold Colors — Light Board ────────────────────────────────
      // Trello's signature: rich blue hierarchy, EBECF0 columns, white cards,
      // clean system sans-serif, rounded corners throughout.

      // "Gold" family → Trello blue family
      '--sg-gold-bright':       '#0079BF',   // Trello primary blue
      '--sg-gold-primary':      '#026AA7',   // Trello header / active blue
      '--sg-gold-dark':         '#005580',   // Trello darker blue for borders
      '--sg-gold-dim':          '#BFD4E0',   // very light blue-gray tint
      '--sg-gold-glow':         'rgba(0, 121, 191, 0.18)',

      // Surfaces — light, clean, Trello-style
      '--sg-surface-void':      '#F0F2F5',   // board background (Trello's grey board)
      '--sg-surface-obsidian':  '#E8ECF0',   // swimlane wrapper
      '--sg-surface-stone':     '#EBECF0',   // column background — Trello's exact column grey
      '--sg-surface-raised':    '#FFFFFF',   // card base — pure white
      '--sg-surface-hover':     '#F4F5F7',   // card hover state
      '--sg-surface-header':    '#026AA7',   // swimlane header — Trello bold blue

      // Bronze → a lighter cornflower for secondary accents
      '--sg-bronze':            '#4C9AFF',
      '--sg-bronze-light':      '#79B8FF',

      // Gem red → Trello label red
      '--sg-gem-red':           '#EB5A46',
      '--sg-gem-glow':          '#FF8F73',

      // Text — dark on light surfaces
      '--sg-text-primary':      '#172B4D',   // Trello's dark navy body text
      '--sg-text-secondary':    '#5E6C84',   // Trello's mid-grey secondary text
      '--sg-text-faint':        '#B3BAC5',   // placeholder / disabled
      '--sg-text-gold':         '#FFFFFF',   // text on blue header surfaces
      '--sg-text-on-gold':      '#FFFFFF',   // text on blue filled buttons

      // Status
      '--sg-status-ok':         '#61BD4F',   // Trello green label
      '--sg-status-alert':      '#F2D600',   // Trello yellow label
      '--sg-status-critical':   '#EB5A46',   // Trello red label

      // Borders — light, subtle
      '--sg-border-faint':      '#E2E4E9',
      '--sg-border-mid':        '#DFE1E6',
      '--sg-border-gold':       '#B3D4ED',   // pale blue tint border
      '--sg-border-active':     '#0079BF',   // focused blue ring

      // Geometry — Trello is generously rounded
      '--sg-radius-panel':      '8px',
      '--sg-radius-column':     '8px',
      '--sg-radius-card':       '6px',
      '--sg-radius-badge':      '12px',       // pill shape for badges
      '--sg-radius-btn':        '4px',

      // Typography — system sans, same as Trello's UI
      '--sg-font-display':      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",

      // Card base — pure white so color-mix tinting starts from white
      '--sg-card-base':         '#FFFFFF',
    },
  },

  'trello-dark': {
    label: 'Trello (Dark)',
    tokens: {
      // ── Trello Bold Colors — Dark Board ─────────────────────────────────
      // Trello's dark board mode: deep navy surfaces, bright blue accents,
      // white cards preserved for legibility, Trello orange-red for danger.

      // "Gold" family → Trello blue family (slightly brighter on dark)
      '--sg-gold-bright':       '#579DFF',   // bright interactive blue on dark
      '--sg-gold-primary':      '#388BFF',   // primary blue
      '--sg-gold-dark':         '#1D5DB3',   // deeper blue for borders
      '--sg-gold-dim':          '#1C2B41',   // dark blue-grey tint
      '--sg-gold-glow':         'rgba(87, 157, 255, 0.22)',

      // Surfaces — Trello dark board palette
      '--sg-surface-void':      '#1D2125',   // outermost board background
      '--sg-surface-obsidian':  '#22272B',   // swimlane container
      '--sg-surface-stone':     '#2C333A',   // column background
      '--sg-surface-raised':    '#22272B',   // card base on dark
      '--sg-surface-hover':     '#2C3440',   // card hover
      '--sg-surface-header':    '#1C2B3A',   // swimlane header band

      // Bronze → muted blue for secondary
      '--sg-bronze':            '#3888CC',
      '--sg-bronze-light':      '#4A9ADD',

      // Gem red → Trello label red (slightly muted on dark)
      '--sg-gem-red':           '#F87462',
      '--sg-gem-glow':          '#FF9C8F',

      // Text — light on dark surfaces
      '--sg-text-primary':      '#B6C2CF',   // Trello dark mode primary text
      '--sg-text-secondary':    '#738496',   // secondary
      '--sg-text-faint':        '#3D4C5C',   // placeholders
      '--sg-text-gold':         '#579DFF',   // interactive blue text
      '--sg-text-on-gold':      '#1D2125',   // dark text on bright blue fills

      // Status
      '--sg-status-ok':         '#4BCE97',   // Trello dark green
      '--sg-status-alert':      '#F5CD47',   // yellow
      '--sg-status-critical':   '#F87462',   // red

      // Borders — dark, subtle
      '--sg-border-faint':      '#282E33',
      '--sg-border-mid':        '#323940',
      '--sg-border-gold':       '#1D3A5A',   // subtle blue border
      '--sg-border-active':     '#579DFF',   // focus ring

      // Geometry — same rounded style as light Trello
      '--sg-radius-panel':      '8px',
      '--sg-radius-column':     '8px',
      '--sg-radius-card':       '6px',
      '--sg-radius-badge':      '12px',
      '--sg-radius-btn':        '4px',

      // Typography — system sans
      '--sg-font-display':      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",

      // Card base — dark surface, color-mix tinting starts from there
      '--sg-card-base':         '#22272B',
    },
  },

  'obsidian-native': {
    label: 'Obsidian Native',
    tokens: {
      // ── Obsidian Native — auto-matches active Obsidian theme ───────────
      // Maps all tokens to Obsidian's own CSS custom properties so the board
      // seamlessly adapts to any community theme or light/dark mode switch.

      // Accent family → Obsidian's interactive-accent
      '--sg-gold-bright':       'var(--interactive-accent)',
      '--sg-gold-primary':      'var(--interactive-accent)',
      '--sg-gold-dark':         'var(--interactive-accent-hover)',
      '--sg-gold-dim':          'var(--background-modifier-border)',
      '--sg-gold-glow':         'var(--background-modifier-box-shadow)',

      // Surfaces → Obsidian background hierarchy
      '--sg-surface-void':      'var(--background-primary)',
      '--sg-surface-obsidian':  'var(--background-primary-alt)',
      '--sg-surface-stone':     'var(--background-secondary)',
      '--sg-surface-raised':    'var(--background-primary)',
      '--sg-surface-hover':     'var(--background-modifier-hover)',
      '--sg-surface-header':    'var(--background-secondary-alt)',

      // Bronze → muted accent
      '--sg-bronze':            'var(--interactive-accent)',
      '--sg-bronze-light':      'var(--interactive-accent-hover)',

      // Gem red → Obsidian's text-error
      '--sg-gem-red':           'var(--text-error)',
      '--sg-gem-glow':          'var(--text-error)',

      // Text
      '--sg-text-primary':      'var(--text-normal)',
      '--sg-text-secondary':    'var(--text-muted)',
      '--sg-text-faint':        'var(--text-faint)',
      '--sg-text-gold':         'var(--interactive-accent)',
      '--sg-text-on-gold':      'var(--text-on-accent)',

      // Status
      '--sg-status-ok':         'var(--text-success, #4A8C2A)',
      '--sg-status-alert':      'var(--text-warning, #E8C84A)',
      '--sg-status-critical':   'var(--text-error)',

      // Borders
      '--sg-border-faint':      'var(--background-modifier-border)',
      '--sg-border-mid':        'var(--background-modifier-border)',
      '--sg-border-gold':       'var(--interactive-accent)',
      '--sg-border-active':     'var(--interactive-accent)',

      // Geometry — match Obsidian's standard rounded corners
      '--sg-radius-panel':      'var(--radius-m, 6px)',
      '--sg-radius-column':     'var(--radius-m, 6px)',
      '--sg-radius-card':       'var(--radius-s, 4px)',
      '--sg-radius-badge':      'var(--radius-s, 4px)',
      '--sg-radius-btn':        'var(--radius-s, 4px)',

      // Typography — use Obsidian's configured font
      '--sg-font-display':      'var(--font-interface)',

      // Card base — matches primary background
      '--sg-card-base':         'var(--background-primary)',
    },
  },
};

export const DEFAULT_THEME: ThemeId = 'stargate';
