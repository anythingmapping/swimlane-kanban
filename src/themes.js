export const THEMES = {
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
            '--sg-gold-bright': '#5EEAAA',
            '--sg-gold-primary': '#2A9070',
            '--sg-gold-dark': '#1A6A4E',
            '--sg-gold-dim': '#104A38',
            '--sg-gold-glow': 'rgba(94, 234, 170, 0.25)',
            '--sg-surface-void': '#090E12',
            '--sg-surface-obsidian': '#0E1418',
            '--sg-surface-stone': '#101820',
            '--sg-surface-raised': '#162030',
            '--sg-surface-hover': '#1C2838',
            '--sg-surface-header': '#090E12',
            '--sg-bronze': '#4488CC',
            '--sg-bronze-light': '#5599DD',
            '--sg-gem-red': '#C04848',
            '--sg-gem-glow': '#DA4444',
            '--sg-text-primary': '#E8F0F0',
            '--sg-text-secondary': '#8AB8C0',
            '--sg-text-faint': '#3A5060',
            '--sg-text-gold': '#5EEAAA',
            '--sg-text-on-gold': '#060A0E',
            '--sg-status-ok': '#2A9070',
            '--sg-status-alert': '#D4920A',
            '--sg-status-critical': '#C04848',
            '--sg-border-faint': '#162838',
            '--sg-border-mid': '#1A3040',
            '--sg-border-gold': '#1A6A4E',
            '--sg-border-active': '#5EEAAA',
            '--sg-radius-panel': '6px',
            '--sg-radius-column': '6px',
            '--sg-radius-card': '4px',
            '--sg-radius-badge': '10px',
            '--sg-radius-btn': '4px',
            '--sg-font-display': "'ZCOOL XiaoWei', 'Noto Sans', serif",
            '--sg-card-base': '#162030',
        },
    },
    'kung-fu-panda-light': {
        label: 'Kung Fu Panda (Light)',
        tokens: {
            // Jade Palace — light variant with cream/parchment backgrounds
            '--sg-gold-bright': '#1A8A60',
            '--sg-gold-primary': '#2A9070',
            '--sg-gold-dark': '#88D4B0',
            '--sg-gold-dim': '#B0E8D0',
            '--sg-gold-glow': 'rgba(42, 144, 112, 0.20)',
            '--sg-surface-void': '#F4F1EA',
            '--sg-surface-obsidian': '#EAE6DC',
            '--sg-surface-stone': '#E2DECE',
            '--sg-surface-raised': '#F8F6F0',
            '--sg-surface-hover': '#D8D4C8',
            '--sg-surface-header': '#EDE9E0',
            '--sg-bronze': '#3A78B0',
            '--sg-bronze-light': '#4A88C0',
            '--sg-gem-red': '#C04848',
            '--sg-gem-glow': '#DA4444',
            '--sg-text-primary': '#2A2A28',
            '--sg-text-secondary': '#5A6058',
            '--sg-text-faint': '#A0A098',
            '--sg-text-gold': '#1A7A55',
            '--sg-text-on-gold': '#F8F6F0',
            '--sg-status-ok': '#2A9070',
            '--sg-status-alert': '#C89020',
            '--sg-status-critical': '#C04848',
            '--sg-border-faint': '#D8D4C8',
            '--sg-border-mid': '#C0BCA8',
            '--sg-border-gold': '#88D4B0',
            '--sg-border-active': '#1A8A60',
            '--sg-radius-panel': '6px',
            '--sg-radius-column': '6px',
            '--sg-radius-card': '4px',
            '--sg-radius-badge': '10px',
            '--sg-radius-btn': '4px',
            '--sg-font-display': "'ZCOOL XiaoWei', 'Noto Sans', serif",
            '--sg-card-base': '#F8F6F0',
        },
    },
    nautical: {
        label: 'Nautical',
        tokens: {
            // Dead Reckoning — parchment/navy/compass gold
            '--sg-gold-bright': '#C8A050',
            '--sg-gold-primary': '#C8A050',
            '--sg-gold-dark': '#6A4A08',
            '--sg-gold-dim': '#4A3408',
            '--sg-gold-glow': 'rgba(200, 160, 80, 0.25)',
            '--sg-surface-void': '#0A0E14',
            '--sg-surface-obsidian': '#0E1420',
            '--sg-surface-stone': '#101828',
            '--sg-surface-raised': '#141C2A',
            '--sg-surface-hover': '#1A2436',
            '--sg-surface-header': '#0A0E14',
            '--sg-bronze': '#1A3366',
            '--sg-bronze-light': '#2A4488',
            '--sg-gem-red': '#BB4444',
            '--sg-gem-glow': '#DD5555',
            '--sg-text-primary': '#D4C8A0',
            '--sg-text-secondary': '#9A9070',
            '--sg-text-faint': '#4A4030',
            '--sg-text-gold': '#C8A050',
            '--sg-text-on-gold': '#0A0E14',
            '--sg-status-ok': '#448844',
            '--sg-status-alert': '#C8A050',
            '--sg-status-critical': '#BB4444',
            '--sg-border-faint': '#1A2030',
            '--sg-border-mid': '#1A2840',
            '--sg-border-gold': '#6A4A08',
            '--sg-border-active': '#C8A050',
            '--sg-radius-panel': '6px',
            '--sg-radius-column': '6px',
            '--sg-radius-card': '4px',
            '--sg-radius-badge': '4px',
            '--sg-radius-btn': '4px',
            '--sg-font-display': "system-ui, -apple-system, sans-serif",
            '--sg-card-base': '#0A0E14',
        },
    },
    bathymetric: {
        label: 'Bathymetric',
        tokens: {
            // Ocean Depths — turquoise/mid-ocean/abyssal navy
            '--sg-gold-bright': '#40E0D0',
            '--sg-gold-primary': '#2288AA',
            '--sg-gold-dark': '#1A3366',
            '--sg-gold-dim': '#0C1A2A',
            '--sg-gold-glow': 'rgba(64, 224, 208, 0.25)',
            '--sg-surface-void': '#040810',
            '--sg-surface-obsidian': '#081018',
            '--sg-surface-stone': '#0A1420',
            '--sg-surface-raised': '#0C1420',
            '--sg-surface-hover': '#0E1824',
            '--sg-surface-header': '#060C14',
            '--sg-bronze': '#2288AA',
            '--sg-bronze-light': '#40C0D0',
            '--sg-gem-red': '#CC3366',
            '--sg-gem-glow': '#FF6688',
            '--sg-text-primary': '#B0C8D8',
            '--sg-text-secondary': '#5088AA',
            '--sg-text-faint': '#1A3050',
            '--sg-text-gold': '#40E0D0',
            '--sg-text-on-gold': '#040810',
            '--sg-status-ok': '#1A3366',
            '--sg-status-alert': '#2288AA',
            '--sg-status-critical': '#CC3366',
            '--sg-border-faint': '#0A1828',
            '--sg-border-mid': '#0C1A2A',
            '--sg-border-gold': '#1A3366',
            '--sg-border-active': '#40E0D0',
            '--sg-radius-panel': '4px',
            '--sg-radius-column': '4px',
            '--sg-radius-card': '3px',
            '--sg-radius-badge': '3px',
            '--sg-radius-btn': '3px',
            '--sg-font-display': "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
            '--sg-card-base': '#0C1420',
        },
    },
    trello: {
        label: 'Trello',
        tokens: {
            // ── Trello Bold Colors — Light Board ────────────────────────────────
            // Trello's signature: rich blue hierarchy, EBECF0 columns, white cards,
            // clean system sans-serif, rounded corners throughout.
            // "Gold" family → Trello blue family
            '--sg-gold-bright': '#0079BF', // Trello primary blue
            '--sg-gold-primary': '#026AA7', // Trello header / active blue
            '--sg-gold-dark': '#005580', // Trello darker blue for borders
            '--sg-gold-dim': '#BFD4E0', // very light blue-gray tint
            '--sg-gold-glow': 'rgba(0, 121, 191, 0.18)',
            // Surfaces — light, clean, Trello-style
            '--sg-surface-void': '#F0F2F5', // board background (Trello's grey board)
            '--sg-surface-obsidian': '#E8ECF0', // swimlane wrapper
            '--sg-surface-stone': '#EBECF0', // column background — Trello's exact column grey
            '--sg-surface-raised': '#FFFFFF', // card base — pure white
            '--sg-surface-hover': '#F4F5F7', // card hover state
            '--sg-surface-header': '#026AA7', // swimlane header — Trello bold blue
            // Bronze → a lighter cornflower for secondary accents
            '--sg-bronze': '#4C9AFF',
            '--sg-bronze-light': '#79B8FF',
            // Gem red → Trello label red
            '--sg-gem-red': '#EB5A46',
            '--sg-gem-glow': '#FF8F73',
            // Text — dark on light surfaces
            '--sg-text-primary': '#172B4D', // Trello's dark navy body text
            '--sg-text-secondary': '#5E6C84', // Trello's mid-grey secondary text
            '--sg-text-faint': '#B3BAC5', // placeholder / disabled
            '--sg-text-gold': '#FFFFFF', // text on blue header surfaces
            '--sg-text-on-gold': '#FFFFFF', // text on blue filled buttons
            // Status
            '--sg-status-ok': '#61BD4F', // Trello green label
            '--sg-status-alert': '#F2D600', // Trello yellow label
            '--sg-status-critical': '#EB5A46', // Trello red label
            // Borders — light, subtle
            '--sg-border-faint': '#E2E4E9',
            '--sg-border-mid': '#DFE1E6',
            '--sg-border-gold': '#B3D4ED', // pale blue tint border
            '--sg-border-active': '#0079BF', // focused blue ring
            // Geometry — Trello is generously rounded
            '--sg-radius-panel': '8px',
            '--sg-radius-column': '8px',
            '--sg-radius-card': '6px',
            '--sg-radius-badge': '12px', // pill shape for badges
            '--sg-radius-btn': '4px',
            // Typography — system sans, same as Trello's UI
            '--sg-font-display': "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            // Card base — pure white so color-mix tinting starts from white
            '--sg-card-base': '#FFFFFF',
        },
    },
    'trello-dark': {
        label: 'Trello (Dark)',
        tokens: {
            // ── Trello Bold Colors — Dark Board ─────────────────────────────────
            // Trello's dark board mode: deep navy surfaces, bright blue accents,
            // white cards preserved for legibility, Trello orange-red for danger.
            // "Gold" family → Trello blue family (slightly brighter on dark)
            '--sg-gold-bright': '#579DFF', // bright interactive blue on dark
            '--sg-gold-primary': '#388BFF', // primary blue
            '--sg-gold-dark': '#1D5DB3', // deeper blue for borders
            '--sg-gold-dim': '#1C2B41', // dark blue-grey tint
            '--sg-gold-glow': 'rgba(87, 157, 255, 0.22)',
            // Surfaces — Trello dark board palette
            '--sg-surface-void': '#1D2125', // outermost board background
            '--sg-surface-obsidian': '#22272B', // swimlane container
            '--sg-surface-stone': '#2C333A', // column background
            '--sg-surface-raised': '#22272B', // card base on dark
            '--sg-surface-hover': '#2C3440', // card hover
            '--sg-surface-header': '#1C2B3A', // swimlane header band
            // Bronze → muted blue for secondary
            '--sg-bronze': '#3888CC',
            '--sg-bronze-light': '#4A9ADD',
            // Gem red → Trello label red (slightly muted on dark)
            '--sg-gem-red': '#F87462',
            '--sg-gem-glow': '#FF9C8F',
            // Text — light on dark surfaces
            '--sg-text-primary': '#B6C2CF', // Trello dark mode primary text
            '--sg-text-secondary': '#738496', // secondary
            '--sg-text-faint': '#3D4C5C', // placeholders
            '--sg-text-gold': '#579DFF', // interactive blue text
            '--sg-text-on-gold': '#1D2125', // dark text on bright blue fills
            // Status
            '--sg-status-ok': '#4BCE97', // Trello dark green
            '--sg-status-alert': '#F5CD47', // yellow
            '--sg-status-critical': '#F87462', // red
            // Borders — dark, subtle
            '--sg-border-faint': '#282E33',
            '--sg-border-mid': '#323940',
            '--sg-border-gold': '#1D3A5A', // subtle blue border
            '--sg-border-active': '#579DFF', // focus ring
            // Geometry — same rounded style as light Trello
            '--sg-radius-panel': '8px',
            '--sg-radius-column': '8px',
            '--sg-radius-card': '6px',
            '--sg-radius-badge': '12px',
            '--sg-radius-btn': '4px',
            // Typography — system sans
            '--sg-font-display': "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            // Card base — dark surface, color-mix tinting starts from there
            '--sg-card-base': '#22272B',
        },
    },
    'obsidian-native': {
        label: 'Obsidian Native',
        tokens: {
            // ── Obsidian Native — auto-matches active Obsidian theme ───────────
            // Maps all tokens to Obsidian's own CSS custom properties so the board
            // seamlessly adapts to any community theme or light/dark mode switch.
            // Accent family → Obsidian's interactive-accent
            '--sg-gold-bright': 'var(--interactive-accent)',
            '--sg-gold-primary': 'var(--interactive-accent)',
            '--sg-gold-dark': 'var(--interactive-accent-hover)',
            '--sg-gold-dim': 'var(--background-modifier-border)',
            '--sg-gold-glow': 'var(--background-modifier-box-shadow)',
            // Surfaces → Obsidian background hierarchy
            '--sg-surface-void': 'var(--background-primary)',
            '--sg-surface-obsidian': 'var(--background-primary-alt)',
            '--sg-surface-stone': 'var(--background-secondary)',
            '--sg-surface-raised': 'var(--background-primary)',
            '--sg-surface-hover': 'var(--background-modifier-hover)',
            '--sg-surface-header': 'var(--background-secondary-alt)',
            // Bronze → muted accent
            '--sg-bronze': 'var(--interactive-accent)',
            '--sg-bronze-light': 'var(--interactive-accent-hover)',
            // Gem red → Obsidian's text-error
            '--sg-gem-red': 'var(--text-error)',
            '--sg-gem-glow': 'var(--text-error)',
            // Text
            '--sg-text-primary': 'var(--text-normal)',
            '--sg-text-secondary': 'var(--text-muted)',
            '--sg-text-faint': 'var(--text-faint)',
            '--sg-text-gold': 'var(--interactive-accent)',
            '--sg-text-on-gold': 'var(--text-on-accent)',
            // Status
            '--sg-status-ok': 'var(--text-success, #4A8C2A)',
            '--sg-status-alert': 'var(--text-warning, #E8C84A)',
            '--sg-status-critical': 'var(--text-error)',
            // Borders
            '--sg-border-faint': 'var(--background-modifier-border)',
            '--sg-border-mid': 'var(--background-modifier-border)',
            '--sg-border-gold': 'var(--interactive-accent)',
            '--sg-border-active': 'var(--interactive-accent)',
            // Geometry — match Obsidian's standard rounded corners
            '--sg-radius-panel': 'var(--radius-m, 6px)',
            '--sg-radius-column': 'var(--radius-m, 6px)',
            '--sg-radius-card': 'var(--radius-s, 4px)',
            '--sg-radius-badge': 'var(--radius-s, 4px)',
            '--sg-radius-btn': 'var(--radius-s, 4px)',
            // Typography — use Obsidian's configured font
            '--sg-font-display': 'var(--font-interface)',
            // Card base — matches primary background
            '--sg-card-base': 'var(--background-primary)',
        },
    },
};
export const DEFAULT_THEME = 'stargate';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGhlbWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE1BQU0sQ0FBQyxNQUFNLE1BQU0sR0FBdUU7SUFDeEYsUUFBUSxFQUFFO1FBQ1IsS0FBSyxFQUFFLFVBQVU7UUFDakIsTUFBTSxFQUFFO1FBQ04sOERBQThEO1FBQzlELG1FQUFtRTtTQUNwRTtLQUNGO0lBRUQsZUFBZSxFQUFFO1FBQ2YsS0FBSyxFQUFFLGVBQWU7UUFDdEIsTUFBTSxFQUFFO1lBQ04sc0NBQXNDO1lBQ3RDLGtCQUFrQixFQUFRLFNBQVM7WUFDbkMsbUJBQW1CLEVBQU8sU0FBUztZQUNuQyxnQkFBZ0IsRUFBVSxTQUFTO1lBQ25DLGVBQWUsRUFBVyxTQUFTO1lBQ25DLGdCQUFnQixFQUFVLDBCQUEwQjtZQUVwRCxtQkFBbUIsRUFBTyxTQUFTO1lBQ25DLHVCQUF1QixFQUFHLFNBQVM7WUFDbkMsb0JBQW9CLEVBQU0sU0FBUztZQUNuQyxxQkFBcUIsRUFBSyxTQUFTO1lBQ25DLG9CQUFvQixFQUFNLFNBQVM7WUFDbkMscUJBQXFCLEVBQUssU0FBUztZQUVuQyxhQUFhLEVBQWEsU0FBUztZQUNuQyxtQkFBbUIsRUFBTyxTQUFTO1lBRW5DLGNBQWMsRUFBWSxTQUFTO1lBQ25DLGVBQWUsRUFBVyxTQUFTO1lBRW5DLG1CQUFtQixFQUFPLFNBQVM7WUFDbkMscUJBQXFCLEVBQUssU0FBUztZQUNuQyxpQkFBaUIsRUFBUyxTQUFTO1lBQ25DLGdCQUFnQixFQUFVLFNBQVM7WUFDbkMsbUJBQW1CLEVBQU8sU0FBUztZQUVuQyxnQkFBZ0IsRUFBVSxTQUFTO1lBQ25DLG1CQUFtQixFQUFPLFNBQVM7WUFDbkMsc0JBQXNCLEVBQUksU0FBUztZQUVuQyxtQkFBbUIsRUFBTyxTQUFTO1lBQ25DLGlCQUFpQixFQUFTLFNBQVM7WUFDbkMsa0JBQWtCLEVBQVEsU0FBUztZQUNuQyxvQkFBb0IsRUFBTSxTQUFTO1lBRW5DLG1C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TSxDQUFDLE1BQU0sYUFBYSxHQUFZLFVBQVUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB0eXBlIFRoZW1lSWQgPSAnc3RhcmdhdGUnIHwgJ2t1bmctZnUtcGFuZGEnIHwgJ2t1bmctZnUtcGFuZGEtbGlnaHQnIHwgJ25hdXRpY2FsJyB8ICdiYXRoeW1ldHJpYycgfCAndHJlbGxvJyB8ICd0cmVsbG8tZGFyaycgfCAnb2JzaWRpYW4tbmF0aXZlJztcblxuZXhwb3J0IGNvbnN0IFRIRU1FUzogUmVjb3JkPFRoZW1lSWQsIHsgbGFiZWw6IHN0cmluZzsgdG9rZW5zOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IH0+ID0ge1xuICBzdGFyZ2F0ZToge1xuICAgIGxhYmVsOiAnU3RhcmdhdGUnLFxuICAgIHRva2Vuczoge1xuICAgICAgLy8gRGVmYXVsdCDigJQgdmFsdWVzIG1hdGNoIHN0eWxlcy5sZXNzLCBzbyBubyBvdmVycmlkZXMgbmVlZGVkLlxuICAgICAgLy8gS2VwdCBlbXB0eTogdGhlIExFU1MgZmlsZSBhbHJlYWR5IGRlZmluZXMgdGhlc2UgYXMgdGhlIGZhbGxiYWNrLlxuICAgIH0sXG4gIH0sXG5cbiAgJ2t1bmctZnUtcGFuZGEnOiB7XG4gICAgbGFiZWw6ICdLdW5nIEZ1IFBhbmRhJyxcbiAgICB0b2tlbnM6IHtcbiAgICAgIC8vIEphZGUgUGFsYWNlIOKAlCBqYWRlL2JsdWUvdGVhbC9pbmRpZ29cbiAgICAgICctLXNnLWdvbGQtYnJpZ2h0JzogICAgICAgJyM1RUVBQUEnLFxuICAgICAgJy0tc2ctZ29sZC1wcmltYXJ5JzogICAgICAnIzJBOTA3MCcsXG4gICAgICAnLS1zZy1nb2xkLWRhcmsnOiAgICAgICAgICcjMUE2QTRFJyxcbiAgICAgICctLXNnLWdvbGQtZGltJzogICAgICAgICAgJyMxMDRBMzgnLFxuICAgICAgJy0tc2ctZ29sZC1nbG93JzogICAgICAgICAncmdiYSg5NCwgMjM0LCAxNzAsIDAuMjUpJyxcblxuICAgICAgJy0tc2ctc3VyZmFjZS12b2lkJzogICAgICAnIzA5MEUxMicsXG4gICAgICAnLS1zZy1zdXJmYWNlLW9ic2lkaWFuJzogICcjMEUxNDE4JyxcbiAgICAgICctLXNnLXN1cmZhY2Utc3RvbmUnOiAgICAgJyMxMDE4MjAnLFxuICAgICAgJy0tc2ctc3VyZmFjZS1yYWlzZWQnOiAgICAnIzE2MjAzMCcsXG4gICAgICAnLS1zZy1zdXJmYWNlLWhvdmVyJzogICAgICcjMUMyODM4JyxcbiAgICAgICctLXNnLXN1cmZhY2UtaGVhZGVyJzogICAgJyMwOTBFMTInLFxuXG4gICAgICAnLS1zZy1icm9uemUnOiAgICAgICAgICAgICcjNDQ4OENDJyxcbiAgICAgICctLXNnLWJyb256ZS1saWdodCc6ICAgICAgJyM1NTk5REQnLFxuXG4gICAgICAnLS1zZy1nZW0tcmVkJzogICAgICAgICAgICcjQzA0ODQ4JyxcbiAgICAgICctLXNnLWdlbS1nbG93JzogICAgICAgICAgJyNEQTQ0NDQnLFxuXG4gICAgICAnLS1zZy10ZXh0LXByaW1hcnknOiAgICAgICcjRThGMEYwJyxcbiAgICAgICctLXNnLXRleHQtc2Vjb25kYXJ5JzogICAgJyM4QUI4QzAnLFxuICAgICAgJy0tc2ctdGV4dC1mYWludCc6ICAgICAgICAnIzNBNTA2MCcsXG4gICAgICAnLS1zZy10ZXh0LWdvbGQnOiAgICAgICAgICcjNUVFQUFBJyxcbiAgICAgICctLXNnLXRleHQtb24tZ29sZCc6ICAgICAgJyMwNjBBMEUnLFxuXG4gICAgICAnLS1zZy1zdGF0dXMtb2snOiAgICAgICAgICcjMkE5MDcwJyxcbiAgICAgICctLXNnLXN0YXR1cy1hbGVydCc6ICAgICAgJyNENDkyMEEnLFxuICAgICAgJy0tc2ctc3RhdHVzLWNyaXRpY2FsJzogICAnI0MwNDg0OCcsXG5cbiAgICAgICctLXNnLWJvcmRlci1mYWludCc6ICAgICAgJyMxNjI4MzgnLFxuICAgICAgJy0tc2ctYm9yZGVyLW1pZCc6ICAgICAgICAnIzFBMzA0MCcsXG4gICAgICAnLS1zZy1ib3JkZXItZ29sZCc6ICAgICAgICcjMUE2QTRFJyxcbiAgICAgICctLXNnLWJvcmRlci1hY3RpdmUnOiAgICAgJyM1RUVBQUEnLFxuXG4gICAgICAnLS1zZy1yYWRpdXMtcGFuZWwnOiAgICAgICc2cHgnLFxuICAgICAgJy0tc2ctcmFkaXVzLWNvbHVtbic6ICAgICAnNnB4JyxcbiAgICAgICctLXNnLXJhZGl1cy1jYXJkJzogICAgICAgJzRweCcsXG4gICAgICAnLS1zZy1yYWRpdXMtYmFkZ2UnOiAgICAgICcxMHB4JyxcbiAgICAgICctLXNnLXJhZGl1cy1idG4nOiAgICAgICAgJzRweCcsXG5cbiAgICAgICctLXNnLWZvbnQtZGlzcGxheSc6ICAgICAgXCInWkNPT0wgWGlhb1dlaScsICdOb3RvIFNhbnMnLCBzZXJpZlwiLFxuXG4gICAgICAnLS1zZy1jYXJkLWJhc2UnOiAgICAgICAgICcjMTYyMDMwJyxcbiAgICB9LFxuICB9LFxuXG4gICdrdW5nLWZ1LXBhbmRhLWxpZ2h0Jzoge1xuICAgIGxhYmVsOiAnS3VuZyBGdSBQYW5kYSAoTGlnaHQpJyxcbiAgICB0b2tlbnM6IHtcbiAgICAgIC8vIEphZGUgUGFsYWNlIOKAlCBsaWdodCB2YXJpYW50IHdpdGggY3JlYW0vcGFyY2htZW50IGJhY2tncm91bmRzXG4gICAgICAnLS1zZy1nb2xkLWJyaWdodCc6ICAgICAgICcjMUE4QTYwJyxcbiAgICAgICctLXNnLWdvbGQtcHJpbWFyeSc6ICAgICAgJyMyQTkwNzAnLFxuICAgICAgJy0tc2ctZ29sZC1kYXJrJzogICAgICAgICAnIzg4RDRCMCcsXG4gICAgICAnLS1zZy1nb2xkLWRpbSc6ICAgICAgICAgICcjQjBFOEQwJyxcbiAgICAgICctLXNnLWdvbGQtZ2xvdyc6ICAgICAgICAgJ3JnYmEoNDIsIDE0NCwgMTEyLCAwLjIwKScsXG5cbiAgICAgICctLXNnLXN1cmZhY2Utdm9pZCc6ICAgICAgJyNGNEYxRUEnLFxuICAgICAgJy0tc2ctc3VyZmFjZS1vYnNpZGlhbic6ICAnI0VBRTZEQycsXG4gICAgICAnLS1zZy1zdXJmYWNlLXN0b25lJzogICAgICcjRTJERUNFJyxcbiAgICAgICctLXNnLXN1cmZhY2UtcmFpc2VkJzogICAgJyNGOEY2RjAnLFxuICAgICAgJy0tc2ctc3VyZmFjZS1ob3Zlcic6ICAgICAnI0Q4RDRDOCcsXG4gICAgICAnLS1zZy1zdXJmYWNlLWhlYWRlcic6ICAgICcjRURFOUUwJyxcblxuICAgICAgJy0tc2ctYnJvbnplJzogICAgICAgICAgICAnIzNBNzhCMCcsXG4gICAgICAnLS1zZy1icm9uemUtbGlnaHQnOiAgICAgICcjNEE4OEMwJyxcblxuICAgICAgJy0tc2ctZ2VtLXJlZCc6ICAgICAgICAgICAnI0MwNDg0OCcsXG4gICAgICAnLS1zZy1nZW0tZ2xvdyc6ICAgICAgICAgICcjREE0NDQ0JyxcblxuICAgICAgJy0tc2ctdGV4dC1wcmltYXJ5JzogICAgICAnIzJBMkEyOCcsXG4gICAgICAnLS1zZy10ZXh0LXNlY29uZGFyeSc6ICAgICcjNUE2MDU4JyxcbiAgICAgICctLXNnLXRleHQtZmFpbnQnOiAgICAgICAgJyNBMEEwOTgnLFxuICAgICAgJy0tc2ctdGV4dC1nb2xkJzogICAgICAgICAnIzFBN0E1NScsXG4gICAgICAnLS1zZy10ZXh0LW9uLWdvbGQnOiAgICAgICcjRjhGNkYwJyxcblxuICAgICAgJy0tc2ctc3RhdHVzLW9rJzogICAgICAgICAnIzJBOTA3MCcsXG4gICAgICAnLS1zZy1zdGF0dXMtYWxlcnQnOiAgICAgICcjQzg5MDIwJyxcbiAgICAgICctLXNnLXN0YXR1cy1jcml0aWNhbCc6ICAgJyNDMDQ4NDgnLFxuXG4gICAgICAnLS1zZy1ib3JkZXItZmFpbnQnOiAgICAgICcjRDhENEM4JyxcbiAgICAgICctLXNnLWJvcmRlci1taWQnOiAgICAgICAgJyNDMEJDQTgnLFxuICAgICAgJy0tc2ctYm9yZGVyLWdvbGQnOiAgICAgICAnIzg4RDRCMCcsXG4gICAgICAnLS1zZy1ib3JkZXItYWN0aXZlJzogICAgICcjMUE4QTYwJyxcblxuICAgICAgJy0tc2ctcmFkaXVzLXBhbmVsJzogICAgICAnNnB4JyxcbiAgICAgICctLXNnLXJhZGl1cy1jb2x1bW4nOiAgICAgJzZweCcsXG4gICAgICAnLS1zZy1yYWRpdXMtY2FyZCc6ICAgICAgICc0cHgnLFxuICAgICAgJy0tc2ctcmFkaXVzLWJhZGdlJzogICAgICAnMTBweCcsXG4gICAgICAnLS1zZy1yYWRpdXMtYnRuJzogICAgICAgICc0cHgnLFxuXG4gICAgICAnLS1zZy1mb250LWRpc3BsYXknOiAgICAgIFwiJ1pDT09MIFhpYW9XZWknLCAnTm90byBTYW5zJywgc2VyaWZcIixcblxuICAgICAgJy0tc2ctY2FyZC1iYXNlJzogICAgICAgICAnI0Y4RjZGMCcsXG4gICAgfSxcbiAgfSxcblxuICBuYXV0aWNhbDoge1xuICAgIGxhYmVsOiAnTmF1dGljYWwnLFxuICAgIHRva2Vuczoge1xuICAgICAgLy8gRGVhZCBSZWNrb25pbmcg4oCUIHBhcmNobWVudC9uYXZ5L2NvbXBhc3MgZ29sZFxuICAgICAgJy0tc2ctZ29sZC1icmlnaHQnOiAgICAgICAnI0M4QTA1MCcsXG4gICAgICAnLS1zZy1nb2xkLXByaW1hcnknOiAgICAgICcjQzhBMDUwJyxcbiAgICAgICctLXNnLWdvbGQtZGFyayc6ICAgICAgICAgJyM2QTRBMDgnLFxuICAgICAgJy0tc2ctZ29sZC1kaW0nOiAgICAgICAgICAnIzRBMzQwOCcsXG4gICAgICAnLS1zZy1nb2xkLWdsb3cnOiAgICAgICAgICdyZ2JhKDIwMCwgMTYwLCA4MCwgMC4yNSknLFxuXG4gICAgICAnLS1zZy1zdXJmYWNlLXZvaWQnOiAgICAgICcjMEEwRTE0JyxcbiAgICAgICctLXNnLXN1cmZhY2Utb2JzaWRpYW4nOiAgJyMwRTE0MjAnLFxuICAgICAgJy0tc2ctc3VyZmFjZS1zdG9uZSc6ICAgICAnIzEwMTgyOCcsXG4gICAgICAnLS1zZy1zdXJmYWNlLXJhaXNlZCc6ICAgICcjMTQxQzJBJyxcbiAgICAgICctLXNnLXN1cmZhY2UtaG92ZXInOiAgICAgJyMxQTI0MzYnLFxuICAgICAgJy0tc2ctc3VyZmFjZS1oZWFkZXInOiAgICAnIzBBMEUxNCcsXG5cbiAgICAgICctLXNnLWJyb256ZSc6ICAgICAgICAgICAgJyMxQTMzNjYnLFxuICAgICAgJy0tc2ctYnJvbnplLWxpZ2h0JzogICAgICAnIzJBNDQ4OCcsXG5cbiAgICAgICctLXNnLWdlbS1yZWQnOiAgICAgICAgICAgJyNCQjQ0NDQnLFxuICAgICAgJy0tc2ctZ2VtLWdsb3cnOiAgICAgICAgICAnI0RENTU1NScsXG5cbiAgICAgICctLXNnLXRleHQtcHJpbWFyeSc6ICAgICAgJyNENEM4QTAnLFxuICAgICAgJy0tc2ctdGV4dC1zZWNvbmRhcnknOiAgICAnIzlBOTA3MCcsXG4gICAgICAnLS1zZy10ZXh0LWZhaW50JzogICAgICAgICcjNEE0MDMwJyxcbiAgICAgICctLXNnLXRleHQtZ29sZCc6ICAgICAgICAgJyNDOEEwNTAnLFxuICAgICAgJy0tc2ctdGV4dC1vbi1nb2xkJzogICAgICAnIzBBMEUxNCcsXG5cbiAgICAgICctLXNnLXN0YXR1cy1vayc6ICAgICAgICAgJyM0NDg4NDQnLFxuICAgICAgJy0tc2ctc3RhdHVzLWFsZXJ0JzogICAgICAnI0M4QTA1MCcsXG4gICAgICAnLS1zZy1zdGF0dXMtY3JpdGljYWwnOiAgICcjQkI0NDQ0JyxcblxuICAgICAgJy0tc2ctYm9yZGVyLWZhaW50JzogICAgICAnIzFBMjAzMCcsXG4gICAgICAnLS1zZy1ib3JkZXItbWlkJzogICAgICAgICcjMUEyODQwJyxcbiAgICAgICctLXNnLWJvcmRlci1nb2xkJzogICAgICAgJyM2QTRBMDgnLFxuICAgICAgJy0tc2ctYm9yZGVyLWFjdGl2ZSc6ICAgICAnI0M4QTA1MCcsXG5cbiAgICAgICctLXNnLXJhZGl1cy1wYW5lbCc6ICAgICAgJzZweCcsXG4gICAgICAnLS1zZy1yYWRpdXMtY29sdW1uJzogICAgICc2cHgnLFxuICAgICAgJy0tc2ctcmFkaXVzLWNhcmQnOiAgICAgICAnNHB4JyxcbiAgICAgICctLXNnLXJhZGl1cy1iYWRnZSc6ICAgICAgJzRweCcsXG4gICAgICAnLS1zZy1yYWRpdXMtYnRuJzogICAgICAgICc0cHgnLFxuXG4gICAgICAnLS1zZy1mb250LWRpc3BsYXknOiAgICAgIFwic3lzdGVtLXVpLCAtYXBwbGUtc3lzdGVtLCBzYW5zLXNlcmlmXCIsXG5cbiAgICAgICctLXNnLWNhcmQtYmFzZSc6ICAgICAgICAgJyMwQTBFMTQnLFxuICAgIH0sXG4gIH0sXG5cbiAgYmF0aHltZXRyaWM6IHtcbiAgICBsYWJlbDogJ0JhdGh5bWV0cmljJyxcbiAgICB0b2tlbnM6IHtcbiAgICAgIC8vIE9jZWFuIERlcHRocyDigJQgdHVycXVvaXNlL21pZC1vY2Vhbi9hYnlzc2FsIG5hdnlcbiAgICAgICctLXNnLWdvbGQtYnJpZ2h0JzogICAgICAgJyM0MEUwRDAnLFxuICAgICAgJy0tc2ctZ29sZC1wcmltYXJ5JzogICAgICAnIzIyODhBQScsXG4gICAgICAnLS1zZy1nb2xkLWRhcmsnOiAgICAgICAgICcjMUEzMzY2JyxcbiAgICAgICctLXNnLWdvbGQtZGltJzogICAgICAgICAgJyMwQzFBMkEnLFxuICAgICAgJy0tc2ctZ29sZC1nbG93JzogICAgICAgICAncmdiYSg2NCwgMjI0LCAyMDgsIDAuMjUpJyxcblxuICAgICAgJy0tc2ctc3VyZmFjZS12b2lkJzogICAgICAnIzA0MDgxMCcsXG4gICAgICAnLS1zZy1zdXJmYWNlLW9ic2lkaWFuJzogICcjMDgxMDE4JyxcbiAgICAgICctLXNnLXN1cmZhY2Utc3RvbmUnOiAgICAgJyMwQTE0MjAnLFxuICAgICAgJy0tc2ctc3VyZmFjZS1yYWlzZWQnOiAgICAnIzBDMTQyMCcsXG4gICAgICAnLS1zZy1zdXJmYWNlLWhvdmVyJzogICAgICcjMEUxODI0JyxcbiAgICAgICctLXNnLXN1cmZhY2UtaGVhZGVyJzogICAgJyMwNjBDMTQnLFxuXG4gICAgICAnLS1zZy1icm9uemUnOiAgICAgICAgICAgICcjMjI4OEFBJyxcbiAgICAgICctLXNnLWJyb256ZS1saWdodCc6ICAgICAgJyM0MEMwRDAnLFxuXG4gICAgICAnLS1zZy1nZW0tcmVkJzogICAgICAgICAgICcjQ0MzMzY2JyxcbiAgICAgICctLXNnLWdlbS1nbG93JzogICAgICAgICAgJyNGRjY2ODgnLFxuXG4gICAgICAnLS1zZy10ZXh0LXByaW1hcnknOiAgICAgICcjQjBDOEQ4JyxcbiAgICAgICctLXNnLXRleHQtc2Vjb25kYXJ5JzogICAgJyM1MDg4QUEnLFxuICAgICAgJy0tc2ctdGV4dC1mYWludCc6ICAgICAgICAnIzFBMzA1MCcsXG4gICAgICAnLS1zZy10ZXh0LWdvbGQnOiAgICAgICAgICcjNDBFMEQwJyxcbiAgICAgICctLXNnLXRleHQtb24tZ29sZCc6ICAgICAgJyMwNDA4MTAnLFxuXG4gICAgICAnLS1zZy1zdGF0dXMtb2snOiAgICAgICAgICcjMUEzMzY2JyxcbiAgICAgICctLXNnLXN0YXR1cy1hbGVydCc6ICAgICAgJyMyMjg4QUEnLFxuICAgICAgJy0tc2ctc3RhdHVzLWNyaXRpY2FsJzogICAnI0NDMzM2NicsXG5cbiAgICAgICctLXNnLWJvcmRlci1mYWludCc6ICAgICAgJyMwQTE4MjgnLFxuICAgICAgJy0tc2ctYm9yZGVyLW1pZCc6ICAgICAgICAnIzBDMUEyQScsXG4gICAgICAnLS1zZy1ib3JkZXItZ29sZCc6ICAgICAgICcjMUEzMzY2JyxcbiAgICAgICctLXNnLWJvcmRlci1hY3RpdmUnOiAgICAgJyM0MEUwRDAnLFxuXG4gICAgICAnLS1zZy1yYWRpdXMtcGFuZWwnOiAgICAgICc0cHgnLFxuICAgICAgJy0tc2ctcmFkaXVzLWNvbHVtbic6ICAgICAnNHB4JyxcbiAgICAgICctLXNnLXJhZGl1cy1jYXJkJzogICAgICAgJzNweCcsXG4gICAgICAnLS1zZy1yYWRpdXMtYmFkZ2UnOiAgICAgICczcHgnLFxuICAgICAgJy0tc2ctcmFkaXVzLWJ0bic6ICAgICAgICAnM3B4JyxcblxuICAgICAgJy0tc2ctZm9udC1kaXNwbGF5JzogICAgICBcIi1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgJ1NlZ29lIFVJJywgc3lzdGVtLXVpLCBzYW5zLXNlcmlmXCIsXG5cbiAgICAgICctLXNnLWNhcmQtYmFzZSc6ICAgICAgICAgJyMwQzE0MjAnLFxuICAgIH0sXG4gIH0sXG5cbiAgdHJlbGxvOiB7XG4gICAgbGFiZWw6ICdUcmVsbG8nLFxuICAgIHRva2Vuczoge1xuICAgICAgLy8g4pSA4pSAIFRyZWxsbyBCb2xkIENvbG9ycyDigJQgTGlnaHQgQm9hcmQg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gICAgICAvLyBUcmVsbG8ncyBzaWduYXR1cmU6IHJpY2ggYmx1ZSBoaWVyYXJjaHksIEVCRUNGMCBjb2x1bW5zLCB3aGl0ZSBjYXJkcyxcbiAgICAgIC8vIGNsZWFuIHN5c3RlbSBzYW5zLXNlcmlmLCByb3VuZGVkIGNvcm5lcnMgdGhyb3VnaG91dC5cblxuICAgICAgLy8gXCJHb2xkXCIgZmFtaWx5IOKGkiBUcmVsbG8gYmx1ZSBmYW1pbHlcbiAgICAgICctLXNnLWdvbGQtYnJpZ2h0JzogICAgICAgJyMwMDc5QkYnLCAgIC8vIFRyZWxsbyBwcmltYXJ5IGJsdWVcbiAgICAgICctLXNnLWdvbGQtcHJpbWFyeSc6ICAgICAgJyMwMjZBQTcnLCAgIC8vIFRyZWxsbyBoZWFkZXIgLyBhY3RpdmUgYmx1ZVxuICAgICAgJy0tc2ctZ29sZC1kYXJrJzogICAgICAgICAnIzAwNTU4MCcsICAgLy8gVHJlbGxvIGRhcmtlciBibHVlIGZvciBib3JkZXJzXG4gICAgICAnLS1zZy1nb2xkLWRpbSc6ICAgICAgICAgICcjQkZENEUwJywgICAvLyB2ZXJ5IGxpZ2h0IGJsdWUtZ3JheSB0aW50XG4gICAgICAnLS1zZy1nb2xkLWdsb3cnOiAgICAgICAgICdyZ2JhKDAsIDEyMSwgMTkxLCAwLjE4KScsXG5cbiAgICAgIC8vIFN1cmZhY2VzIOKAlCBsaWdodCwgY2xlYW4sIFRyZWxsby1zdHlsZVxuICAgICAgJy0tc2ctc3VyZmFjZS12b2lkJzogICAgICAnI0YwRjJGNScsICAgLy8gYm9hcmQgYmFja2dyb3VuZCAoVHJlbGxvJ3MgZ3JleSBib2FyZClcbiAgICAgICctLXNnLXN1cmZhY2Utb2JzaWRpYW4nOiAgJyNFOEVDRjAnLCAgIC8vIHN3aW1sYW5lIHdyYXBwZXJcbiAgICAgICctLXNnLXN1cmZhY2Utc3RvbmUnOiAgICAgJyNFQkVDRjAnLCAgIC8vIGNvbHVtbiBiYWNrZ3JvdW5kIOKAlCBUcmVsbG8ncyBleGFjdCBjb2x1bW4gZ3JleVxuICAgICAgJy0tc2ctc3VyZmFjZS1yYWlzZWQnOiAgICAnI0ZGRkZGRicsICAgLy8gY2FyZCBiYXNlIOKAlCBwdXJlIHdoaXRlXG4gICAgICAnLS1zZy1zdXJmYWNlLWhvdmVyJzogICAgICcjRjRGNUY3JywgICAvLyBjYXJkIGhvdmVyIHN0YXRlXG4gICAgICAnLS1zZy1zdXJmYWNlLWhlYWRlcic6ICAgICcjMDI2QUE3JywgICAvLyBzd2ltbGFuZSBoZWFkZXIg4oCUIFRyZWxsbyBib2xkIGJsdWVcblxuICAgICAgLy8gQnJvbnplIOKGkiBhIGxpZ2h0ZXIgY29ybmZsb3dlciBmb3Igc2Vjb25kYXJ5IGFjY2VudHNcbiAgICAgICctLXNnLWJyb256ZSc6ICAgICAgICAgICAgJyM0QzlBRkYnLFxuICAgICAgJy0tc2ctYnJvbnplLWxpZ2h0JzogICAgICAnIzc5QjhGRicsXG5cbiAgICAgIC8vIEdlbSByZWQg4oaSIFRyZWxsbyBsYWJlbCByZWRcbiAgICAgICctLXNnLWdlbS1yZWQnOiAgICAgICAgICAgJyNFQjVBNDYnLFxuICAgICAgJy0tc2ctZ2VtLWdsb3cnOiAgICAgICAgICAnI0ZGOEY3MycsXG5cbiAgICAgIC8vIFRleHQg4oCUIGRhcmsgb24gbGlnaHQgc3VyZmFjZXNcbiAgICAgICctLXNnLXRleHQtcHJpbWFyeSc6ICAgICAgJyMxNzJCNEQnLCAgIC8vIFRyZWxsbydzIGRhcmsgbmF2eSBib2R5IHRleHRcbiAgICAgICctLXNnLXRleHQtc2Vjb25kYXJ5JzogICAgJyM1RTZDODQnLCAgIC8vIFRyZWxsbydzIG1pZC1ncmV5IHNlY29uZGFyeSB0ZXh0XG4gICAgICAnLS1zZy10ZXh0LWZhaW50JzogICAgICAgICcjQjNCQUM1JywgICAvLyBwbGFjZWhvbGRlciAvIGRpc2FibGVkXG4gICAgICAnLS1zZy10ZXh0LWdvbGQnOiAgICAgICAgICcjRkZGRkZGJywgICAvLyB0ZXh0IG9uIGJsdWUgaGVhZGVyIHN1cmZhY2VzXG4gICAgICAnLS1zZy10ZXh0LW9uLWdvbGQnOiAgICAgICcjRkZGRkZGJywgICAvLyB0ZXh0IG9uIGJsdWUgZmlsbGVkIGJ1dHRvbnNcblxuICAgICAgLy8gU3RhdHVzXG4gICAgICAnLS1zZy1zdGF0dXMtb2snOiAgICAgICAgICcjNjFCRDRGJywgICAvLyBUcmVsbG8gZ3JlZW4gbGFiZWxcbiAgICAgICctLXNnLXN0YXR1cy1hbGVydCc6ICAgICAgJyNGMkQ2MDAnLCAgIC8vIFRyZWxsbyB5ZWxsb3cgbGFiZWxcbiAgICAgICctLXNnLXN0YXR1cy1jcml0aWNhbCc6ICAgJyNFQjVBNDYnLCAgIC8vIFRyZWxsbyByZWQgbGFiZWxcblxuICAgICAgLy8gQm9yZGVycyDigJQgbGlnaHQsIHN1YnRsZVxuICAgICAgJy0tc2ctYm9yZGVyLWZhaW50JzogICAgICAnI0UyRTRFOScsXG4gICAgICAnLS1zZy1ib3JkZXItbWlkJzogICAgICAgICcjREZFMUU2JyxcbiAgICAgICctLXNnLWJvcmRlci1nb2xkJzogICAgICAgJyNCM0Q0RUQnLCAgIC8vIHBhbGUgYmx1ZSB0aW50IGJvcmRlclxuICAgICAgJy0tc2ctYm9yZGVyLWFjdGl2ZSc6ICAgICAnIzAwNzlCRicsICAgLy8gZm9jdXNlZCBibHVlIHJpbmdcblxuICAgICAgLy8gR2VvbWV0cnkg4oCUIFRyZWxsbyBpcyBnZW5lcm91c2x5IHJvdW5kZWRcbiAgICAgICctLXNnLXJhZGl1cy1wYW5lbCc6ICAgICAgJzhweCcsXG4gICAgICAnLS1zZy1yYWRpdXMtY29sdW1uJzogICAgICc4cHgnLFxuICAgICAgJy0tc2ctcmFkaXVzLWNhcmQnOiAgICAgICAnNnB4JyxcbiAgICAgICctLXNnLXJhZGl1cy1iYWRnZSc6ICAgICAgJzEycHgnLCAgICAgICAvLyBwaWxsIHNoYXBlIGZvciBiYWRnZXNcbiAgICAgICctLXNnLXJhZGl1cy1idG4nOiAgICAgICAgJzRweCcsXG5cbiAgICAgIC8vIFR5cG9ncmFwaHkg4oCUIHN5c3RlbSBzYW5zLCBzYW1lIGFzIFRyZWxsbydzIFVJXG4gICAgICAnLS1zZy1mb250LWRpc3BsYXknOiAgICAgIFwiLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCAnU2Vnb2UgVUknLCAnSGVsdmV0aWNhIE5ldWUnLCBBcmlhbCwgc2Fucy1zZXJpZlwiLFxuXG4gICAgICAvLyBDYXJkIGJhc2Ug4oCUIHB1cmUgd2hpdGUgc28gY29sb3ItbWl4IHRpbnRpbmcgc3RhcnRzIGZyb20gd2hpdGVcbiAgICAgICctLXNnLWNhcmQtYmFzZSc6ICAgICAgICAgJyNGRkZGRkYnLFxuICAgIH0sXG4gIH0sXG5cbiAgJ3RyZWxsby1kYXJrJzoge1xuICAgIGxhYmVsOiAnVHJlbGxvIChEYXJrKScsXG4gICAgdG9rZW5zOiB7XG4gICAgICAvLyDilIDilIAgVHJlbGxvIEJvbGQgQ29sb3JzIOKAlCBEYXJrIEJvYXJkIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuICAgICAgLy8gVHJlbGxvJ3MgZGFyayBib2FyZCBtb2RlOiBkZWVwIG5hdnkgc3VyZmFjZXMsIGJyaWdodCBibHVlIGFjY2VudHMsXG4gICAgICAvLyB3aGl0ZSBjYXJkcyBwcmVzZXJ2ZWQgZm9yIGxlZ2liaWxpdHksIFRyZWxsbyBvcmFuZ2UtcmVkIGZvciBkYW5nZXIuXG5cbiAgICAgIC8vIFwiR29sZFwiIGZhbWlseSDihpIgVHJlbGxvIGJsdWUgZmFtaWx5IChzbGlnaHRseSBicmlnaHRlciBvbiBkYXJrKVxuICAgICAgJy0tc2ctZ29sZC1icmlnaHQnOiAgICAgICAnIzU3OURGRicsICAgLy8gYnJpZ2h0IGludGVyYWN0aXZlIGJsdWUgb24gZGFya1xuICAgICAgJy0tc2ctZ29sZC1wcmltYXJ5JzogICAgICAnIzM4OEJGRicsICAgLy8gcHJpbWFyeSBibHVlXG4gICAgICAnLS1zZy1nb2xkLWRhcmsnOiAgICAgICAgICcjMUQ1REIzJywgICAvLyBkZWVwZXIgYmx1ZSBmb3IgYm9yZGVyc1xuICAgICAgJy0tc2ctZ29sZC1kaW0nOiAgICAgICAgICAnIzFDMkI0MScsICAgLy8gZGFyayBibHVlLWdyZXkgdGludFxuICAgICAgJy0tc2ctZ29sZC1nbG93JzogICAgICAgICAncmdiYSg4NywgMTU3LCAyNTUsIDAuMjIpJyxcblxuICAgICAgLy8gU3VyZmFjZXMg4oCUIFRyZWxsbyBkYXJrIGJvYXJkIHBhbGV0dGVcbiAgICAgICctLXNnLXN1cmZhY2Utdm9pZCc6ICAgICAgJyMxRDIxMjUnLCAgIC8vIG91dGVybW9zdCBib2FyZCBiYWNrZ3JvdW5kXG4gICAgICAnLS1zZy1zdXJmYWNlLW9ic2lkaWFuJzogICcjMjIyNzJCJywgICAvLyBzd2ltbGFuZSBjb250YWluZXJcbiAgICAgICctLXNnLXN1cmZhY2Utc3RvbmUnOiAgICAgJyMyQzMzM0EnLCAgIC8vIGNvbHVtbiBiYWNrZ3JvdW5kXG4gICAgICAnLS1zZy1zdXJmYWNlLXJhaXNlZCc6ICAgICcjMjIyNzJCJywgICAvLyBjYXJkIGJhc2Ugb24gZGFya1xuICAgICAgJy0tc2ctc3VyZmFjZS1ob3Zlcic6ICAgICAnIzJDMzQ0MCcsICAgLy8gY2FyZCBob3ZlclxuICAgICAgJy0tc2ctc3VyZmFjZS1oZWFkZXInOiAgICAnIzFDMkIzQScsICAgLy8gc3dpbWxhbmUgaGVhZGVyIGJhbmRcblxuICAgICAgLy8gQnJvbnplIOKGkiBtdXRlZCBibHVlIGZvciBzZWNvbmRhcnlcbiAgICAgICctLXNnLWJyb256ZSc6ICAgICAgICAgICAgJyMzODg4Q0MnLFxuICAgICAgJy0tc2ctYnJvbnplLWxpZ2h0JzogICAgICAnIzRBOUFERCcsXG5cbiAgICAgIC8vIEdlbSByZWQg4oaSIFRyZWxsbyBsYWJlbCByZWQgKHNsaWdodGx5IG11dGVkIG9uIGRhcmspXG4gICAgICAnLS1zZy1nZW0tcmVkJzogICAgICAgICAgICcjRjg3NDYyJyxcbiAgICAgICctLXNnLWdlbS1nbG93JzogICAgICAgICAgJyNGRjlDOEYnLFxuXG4gICAgICAvLyBUZXh0IOKAlCBsaWdodCBvbiBkYXJrIHN1cmZhY2VzXG4gICAgICAnLS1zZy10ZXh0LXByaW1hcnknOiAgICAgICcjQjZDMkNGJywgICAvLyBUcmVsbG8gZGFyayBtb2RlIHByaW1hcnkgdGV4dFxuICAgICAgJy0tc2ctdGV4dC1zZWNvbmRhcnknOiAgICAnIzczODQ5NicsICAgLy8gc2Vjb25kYXJ5XG4gICAgICAnLS1zZy10ZXh0LWZhaW50JzogICAgICAgICcjM0Q0QzVDJywgICAvLyBwbGFjZWhvbGRlcnNcbiAgICAgICctLXNnLXRleHQtZ29sZCc6ICAgICAgICAgJyM1NzlERkYnLCAgIC8vIGludGVyYWN0aXZlIGJsdWUgdGV4dFxuICAgICAgJy0tc2ctdGV4dC1vbi1nb2xkJzogICAgICAnIzFEMjEyNScsICAgLy8gZGFyayB0ZXh0IG9uIGJyaWdodCBibHVlIGZpbGxzXG5cbiAgICAgIC8vIFN0YXR1c1xuICAgICAgJy0tc2ctc3RhdHVzLW9rJzogICAgICAgICAnIzRCQ0U5NycsICAgLy8gVHJlbGxvIGRhcmsgZ3JlZW5cbiAgICAgICctLXNnLXN0YXR1cy1hbGVydCc6ICAgICAgJyNGNUNENDcnLCAgIC8vIHllbGxvd1xuICAgICAgJy0tc2ctc3RhdHVzLWNyaXRpY2FsJzogICAnI0Y4NzQ2MicsICAgLy8gcmVkXG5cbiAgICAgIC8vIEJvcmRlcnMg4oCUIGRhcmssIHN1YnRsZVxuICAgICAgJy0tc2ctYm9yZGVyLWZhaW50JzogICAgICAnIzI4MkUzMycsXG4gICAgICAnLS1zZy1ib3JkZXItbWlkJzogICAgICAgICcjMzIzOTQwJyxcbiAgICAgICctLXNnLWJvcmRlci1nb2xkJzogICAgICAgJyMxRDNBNUEnLCAgIC8vIHN1YnRsZSBibHVlIGJvcmRlclxuICAgICAgJy0tc2ctYm9yZGVyLWFjdGl2ZSc6ICAgICAnIzU3OURGRicsICAgLy8gZm9jdXMgcmluZ1xuXG4gICAgICAvLyBHZW9tZXRyeSDigJQgc2FtZSByb3VuZGVkIHN0eWxlIGFzIGxpZ2h0IFRyZWxsb1xuICAgICAgJy0tc2ctcmFkaXVzLXBhbmVsJzogICAgICAnOHB4JyxcbiAgICAgICctLXNnLXJhZGl1cy1jb2x1bW4nOiAgICAgJzhweCcsXG4gICAgICAnLS1zZy1yYWRpdXMtY2FyZCc6ICAgICAgICc2cHgnLFxuICAgICAgJy0tc2ctcmFkaXVzLWJhZGdlJzogICAgICAnMTJweCcsXG4gICAgICAnLS1zZy1yYWRpdXMtYnRuJzogICAgICAgICc0cHgnLFxuXG4gICAgICAvLyBUeXBvZ3JhcGh5IOKAlCBzeXN0ZW0gc2Fuc1xuICAgICAgJy0tc2ctZm9udC1kaXNwbGF5JzogICAgICBcIi1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgJ1NlZ29lIFVJJywgJ0hlbHZldGljYSBOZXVlJywgQXJpYWwsIHNhbnMtc2VyaWZcIixcblxuICAgICAgLy8gQ2FyZCBiYXNlIOKAlCBkYXJrIHN1cmZhY2UsIGNvbG9yLW1peCB0aW50aW5nIHN0YXJ0cyBmcm9tIHRoZXJlXG4gICAgICAnLS1zZy1jYXJkLWJhc2UnOiAgICAgICAgICcjMjIyNzJCJyxcbiAgICB9LFxuICB9LFxuXG4gICdvYnNpZGlhbi1uYXRpdmUnOiB7XG4gICAgbGFiZWw6ICdPYnNpZGlhbiBOYXRpdmUnLFxuICAgIHRva2Vuczoge1xuICAgICAgLy8g4pSA4pSAIE9ic2lkaWFuIE5hdGl2ZSDigJQgYXV0by1tYXRjaGVzIGFjdGl2ZSBPYnNpZGlhbiB0aGVtZSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAgICAgIC8vIE1hcHMgYWxsIHRva2VucyB0byBPYnNpZGlhbidzIG93biBDU1MgY3VzdG9tIHByb3BlcnRpZXMgc28gdGhlIGJvYXJkXG4gICAgICAvLyBzZWFtbGVzc2x5IGFkYXB0cyB0byBhbnkgY29tbXVuaXR5IHRoZW1lIG9yIGxpZ2h0L2RhcmsgbW9kZSBzd2l0Y2guXG5cbiAgICAgIC8vIEFjY2VudCBmYW1pbHkg4oaSIE9ic2lkaWFuJ3MgaW50ZXJhY3RpdmUtYWNjZW50XG4gICAgICAnLS1zZy1nb2xkLWJyaWdodCc6ICAgICAgICd2YXIoLS1pbnRlcmFjdGl2ZS1hY2NlbnQpJyxcbiAgICAgICctLXNnLWdvbGQtcHJpbWFyeSc6ICAgICAgJ3ZhcigtLWludGVyYWN0aXZlLWFjY2VudCknLFxuICAgICAgJy0tc2ctZ29sZC1kYXJrJzogICAgICAgICAndmFyKC0taW50ZXJhY3RpdmUtYWNjZW50LWhvdmVyKScsXG4gICAgICAnLS1zZy1nb2xkLWRpbSc6ICAgICAgICAgICd2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlciknLFxuICAgICAgJy0tc2ctZ29sZC1nbG93JzogICAgICAgICAndmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3gtc2hhZG93KScsXG5cbiAgICAgIC8vIFN1cmZhY2VzIOKGkiBPYnNpZGlhbiBiYWNrZ3JvdW5kIGhpZXJhcmNoeVxuICAgICAgJy0tc2ctc3VyZmFjZS12b2lkJzogICAgICAndmFyKC0tYmFja2dyb3VuZC1wcmltYXJ5KScsXG4gICAgICAnLS1zZy1zdXJmYWNlLW9ic2lkaWFuJzogICd2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnktYWx0KScsXG4gICAgICAnLS1zZy1zdXJmYWNlLXN0b25lJzogICAgICd2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSknLFxuICAgICAgJy0tc2ctc3VyZmFjZS1yYWlzZWQnOiAgICAndmFyKC0tYmFja2dyb3VuZC1wcmltYXJ5KScsXG4gICAgICAnLS1zZy1zdXJmYWNlLWhvdmVyJzogICAgICd2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWhvdmVyKScsXG4gICAgICAnLS1zZy1zdXJmYWNlLWhlYWRlcic6ICAgICd2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeS1hbHQpJyxcblxuICAgICAgLy8gQnJvbnplIOKGkiBtdXRlZCBhY2NlbnRcbiAgICAgICctLXNnLWJyb256ZSc6ICAgICAgICAgICAgJ3ZhcigtLWludGVyYWN0aXZlLWFjY2VudCknLFxuICAgICAgJy0tc2ctYnJvbnplLWxpZ2h0JzogICAgICAndmFyKC0taW50ZXJhY3RpdmUtYWNjZW50LWhvdmVyKScsXG5cbiAgICAgIC8vIEdlbSByZWQg4oaSIE9ic2lkaWFuJ3MgdGV4dC1lcnJvclxuICAgICAgJy0tc2ctZ2VtLXJlZCc6ICAgICAgICAgICAndmFyKC0tdGV4dC1lcnJvciknLFxuICAgICAgJy0tc2ctZ2VtLWdsb3cnOiAgICAgICAgICAndmFyKC0tdGV4dC1lcnJvciknLFxuXG4gICAgICAvLyBUZXh0XG4gICAgICAnLS1zZy10ZXh0LXByaW1hcnknOiAgICAgICd2YXIoLS10ZXh0LW5vcm1hbCknLFxuICAgICAgJy0tc2ctdGV4dC1zZWNvbmRhcnknOiAgICAndmFyKC0tdGV4dC1tdXRlZCknLFxuICAgICAgJy0tc2ctdGV4dC1mYWludCc6ICAgICAgICAndmFyKC0tdGV4dC1mYWludCknLFxuICAgICAgJy0tc2ctdGV4dC1nb2xkJzogICAgICAgICAndmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KScsXG4gICAgICAnLS1zZy10ZXh0LW9uLWdvbGQnOiAgICAgICd2YXIoLS10ZXh0LW9uLWFjY2VudCknLFxuXG4gICAgICAvLyBTdGF0dXNcbiAgICAgICctLXNnLXN0YXR1cy1vayc6ICAgICAgICAgJ3ZhcigtLXRleHQtc3VjY2VzcywgIzRBOEMyQSknLFxuICAgICAgJy0tc2ctc3RhdHVzLWFsZXJ0JzogICAgICAndmFyKC0tdGV4dC13YXJuaW5nLCAjRThDODRBKScsXG4gICAgICAnLS1zZy1zdGF0dXMtY3JpdGljYWwnOiAgICd2YXIoLS10ZXh0LWVycm9yKScsXG5cbiAgICAgIC8vIEJvcmRlcnNcbiAgICAgICctLXNnLWJvcmRlci1mYWludCc6ICAgICAgJ3ZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKScsXG4gICAgICAnLS1zZy1ib3JkZXItbWlkJzogICAgICAgICd2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlciknLFxuICAgICAgJy0tc2ctYm9yZGVyLWdvbGQnOiAgICAgICAndmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KScsXG4gICAgICAnLS1zZy1ib3JkZXItYWN0aXZlJzogICAgICd2YXIoLS1pbnRlcmFjdGl2ZS1hY2NlbnQpJyxcblxuICAgICAgLy8gR2VvbWV0cnkg4oCUIG1hdGNoIE9ic2lkaWFuJ3Mgc3RhbmRhcmQgcm91bmRlZCBjb3JuZXJzXG4gICAgICAnLS1zZy1yYWRpdXMtcGFuZWwnOiAgICAgICd2YXIoLS1yYWRpdXMtbSwgNnB4KScsXG4gICAgICAnLS1zZy1yYWRpdXMtY29sdW1uJzogICAgICd2YXIoLS1yYWRpdXMtbSwgNnB4KScsXG4gICAgICAnLS1zZy1yYWRpdXMtY2FyZCc6ICAgICAgICd2YXIoLS1yYWRpdXMtcywgNHB4KScsXG4gICAgICAnLS1zZy1yYWRpdXMtYmFkZ2UnOiAgICAgICd2YXIoLS1yYWRpdXMtcywgNHB4KScsXG4gICAgICAnLS1zZy1yYWRpdXMtYnRuJzogICAgICAgICd2YXIoLS1yYWRpdXMtcywgNHB4KScsXG5cbiAgICAgIC8vIFR5cG9ncmFwaHkg4oCUIHVzZSBPYnNpZGlhbidzIGNvbmZpZ3VyZWQgZm9udFxuICAgICAgJy0tc2ctZm9udC1kaXNwbGF5JzogICAgICAndmFyKC0tZm9udC1pbnRlcmZhY2UpJyxcblxuICAgICAgLy8gQ2FyZCBiYXNlIOKAlCBtYXRjaGVzIHByaW1hcnkgYmFja2dyb3VuZFxuICAgICAgJy0tc2ctY2FyZC1iYXNlJzogICAgICAgICAndmFyKC0tYmFja2dyb3VuZC1wcmltYXJ5KScsXG4gICAgfSxcbiAgfSxcbn07XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1RIRU1FOiBUaGVtZUlkID0gJ3N0YXJnYXRlJztcbiJdfQ==