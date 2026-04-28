import { App } from 'obsidian';
import { createPortal } from 'preact/compat';
import { useCallback, useEffect, useRef, useState } from 'preact/compat';

interface SuggestState {
  query: string;
  triggerStart: number;
  suggestions: string[];
  selectedIndex: number;
}

interface AnchorPos {
  top: number;
  left: number;
  width: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWikiLinkSuggest(
  app: App,
  value: string,
  setValue: (v: string) => void,
  inputRef: { current: HTMLInputElement | HTMLTextAreaElement | null }
) {
  const [suggest, setSuggest] = useState<SuggestState | null>(null);
  const [anchor, setAnchor] = useState<AnchorPos | null>(null);

  // Recompute suggestions whenever value changes
  useEffect(() => {
    const el = inputRef.current;
    if (!el) {
      setSuggest(null);
      return;
    }

    const cursor = el.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const idx = before.lastIndexOf('[[');

    if (idx === -1) {
      setSuggest(null);
      return;
    }

    const query = before.slice(idx + 2);
    // Already closed — [[...]] completed
    if (query.includes(']]') || query.includes('\n')) {
      setSuggest(null);
      return;
    }

    const files = app.vault.getMarkdownFiles();
    const lower = query.toLowerCase();
    const suggestions = files
      .filter((f) => f.basename.toLowerCase().includes(lower))
      .map((f) => f.basename)
      .sort((a, b) => {
        // Prefer prefix matches
        const aStarts = a.toLowerCase().startsWith(lower);
        const bStarts = b.toLowerCase().startsWith(lower);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 8);

    if (suggestions.length === 0) {
      setSuggest(null);
      return;
    }

    // Anchor below the input element
    const rect = el.getBoundingClientRect();
    setAnchor({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    setSuggest({ query, triggerStart: idx, suggestions, selectedIndex: 0 });
  }, [value]);

  const accept = useCallback(
    (suggestion: string) => {
      const el = inputRef.current;
      if (!el) return;
      const cursor = el.selectionStart ?? value.length;
      const before = value.slice(0, cursor);
      const idx = before.lastIndexOf('[[');
      if (idx === -1) return;

      const newValue =
        value.slice(0, idx) + '[[' + suggestion + ']]' + value.slice(cursor);
      setValue(newValue);
      setSuggest(null);

      requestAnimationFrame(() => {
        const newCursor = idx + suggestion.length + 4; // [[ + name + ]]
        el.setSelectionRange(newCursor, newCursor);
        el.focus();
      });
    },
    [value, setValue, inputRef]
  );

  // Returns true if the key was handled (caller should stop its own handler)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent): boolean => {
      if (!suggest) return false;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggest((s) =>
          s ? { ...s, selectedIndex: Math.min(s.selectedIndex + 1, s.suggestions.length - 1) } : null
        );
        return true;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggest((s) =>
          s ? { ...s, selectedIndex: Math.max(s.selectedIndex - 1, 0) } : null
        );
        return true;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        const sel = suggest.suggestions[suggest.selectedIndex];
        if (sel) {
          e.preventDefault();
          accept(sel);
          return true;
        }
      }
      if (e.key === 'Escape') {
        setSuggest(null);
        return true;
      }
      return false;
    },
    [suggest, accept]
  );

  const close = useCallback(() => setSuggest(null), []);

  return { suggest, anchor, accept, handleKeyDown, close };
}

// ---------------------------------------------------------------------------
// Dropdown rendered via portal
// ---------------------------------------------------------------------------

interface WikiLinkDropdownProps {
  suggest: SuggestState;
  anchor: AnchorPos;
  accept: (s: string) => void;
  close: () => void;
}

export function WikiLinkDropdown({ suggest, anchor, accept, close }: WikiLinkDropdownProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector<HTMLDivElement>('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [suggest.selectedIndex]);

  const dropdown = (
    <div
      class="swimlane-kanban__wikilink-suggest"
      style={{
        position: 'fixed',
        top: anchor.top,
        left: anchor.left,
        minWidth: Math.max(anchor.width, 200),
        zIndex: 10000,
      }}
      // Prevent blur on the input when clicking a suggestion
      onMouseDown={(e) => e.preventDefault()}
    >
      <div ref={listRef} class="swimlane-kanban__wikilink-suggest-list">
        {suggest.suggestions.map((s, i) => (
          <div
            key={s}
            class={
              'swimlane-kanban__wikilink-suggest-item' +
              (i === suggest.selectedIndex ? ' swimlane-kanban__wikilink-suggest-item--selected' : '')
            }
            data-selected={i === suggest.selectedIndex ? 'true' : 'false'}
            onMouseDown={(e) => {
              e.preventDefault();
              accept(s);
            }}
          >
            <span class="swimlane-kanban__wikilink-suggest-icon">⟦⟧</span>
            {s}
          </div>
        ))}
      </div>
    </div>
  );

  return createPortal(dropdown, activeDocument.body);
}
