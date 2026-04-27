import { MarkdownRenderer, Menu, Notice, TFile } from 'obsidian';
import { CSSProperties, useContext, useEffect, useMemo, useRef, useState } from 'preact/compat';

import { Droppable } from '../dnd/components/Droppable';
import { ScrollContainer } from '../dnd/components/ScrollContainer';
import { Sortable } from '../dnd/components/Sortable';
import { SortPlaceholder } from '../dnd/components/SortPlaceholder';
import { updateEntity, getEntityFromPath } from '../dnd/util/data';
import { EntityData } from '../dnd/types';
import { ColumnTemplate, DataTypes, Item, Swimlane as SwimlaneType, generateInstanceId } from '../types';
import { Column } from './Column';
import { InputModal, TextareaModal } from './InputModal';
import { SwimlaneKanbanContext } from './context';
import { c } from './helpers';

const COLUMN_TRIGGER_TYPES = [DataTypes.Column];

interface SwimlaneProps {
  swimlane: SwimlaneType;
  swimlaneIndex: number;
}

export function Swimlane({ swimlane, swimlaneIndex }: SwimlaneProps) {
  const { boardModifiers, stateManager, view } = useContext(SwimlaneKanbanContext);
  const [collapsed, setCollapsed] = useState(true);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState(swimlane.data.description || '');
  const elementRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Wikilink suggest state
  const [wlSuggestions, setWlSuggestions] = useState<TFile[]>([]);
  const [wlIndex, setWlIndex] = useState(0);

  // Keep editDesc in sync with external state changes
  useEffect(() => {
    if (!isEditingDesc) {
      setEditDesc(swimlane.data.description || '');
    }
  }, [swimlane.data.description]);

  // Render markdown description using Obsidian's renderer (handles [[wikilinks]])
  useEffect(() => {
    if (isEditingDesc || !descriptionRef.current) return;
    descriptionRef.current.empty();
    const desc = swimlane.data.description;
    if (desc) {
      MarkdownRenderer.render(
        stateManager.app,
        desc,
        descriptionRef.current,
        view?.file?.path || '',
        view
      );
    }
  }, [swimlane.data.description, isEditingDesc]);

  // Handle clicks on internal links rendered by MarkdownRenderer
  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a.internal-link') as HTMLAnchorElement | null;
      if (!anchor) return;
      e.preventDefault();
      e.stopPropagation();
      const href = anchor.dataset.href || anchor.getAttribute('href') || '';
      if (href) stateManager.app.workspace.openLinkText(href, view?.file?.path || '', false);
    };
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, []);

  // Auto-focus textarea when editing starts
  useEffect(() => {
    if (isEditingDesc && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditingDesc]);

  const saveDescription = () => {
    setIsEditingDesc(false);
    setWlSuggestions([]);
    const trimmed = editDesc.trim();
    if (trimmed !== (swimlane.data.description || '')) {
      stateManager.setState((board: any) =>
        updateEntity(board, [swimlaneIndex], {
          data: { $merge: { description: trimmed || undefined } },
        })
      );
    }
  };

  // Detect [[query at cursor and update suggestions
  const updateWlSuggestions = (ta: HTMLTextAreaElement) => {
    const pos = ta.selectionStart ?? ta.value.length;
    const before = ta.value.slice(0, pos);
    const match = before.match(/\[\[([^\][\n|]*)$/);
    if (match) {
      const query = match[1].toLowerCase();
      const files = stateManager.app.vault.getMarkdownFiles();
      const filtered = files
        .filter(f => f.basename.toLowerCase().includes(query))
        .sort((a, b) => {
          // Exact prefix matches first
          const aStarts = a.basename.toLowerCase().startsWith(query);
          const bStarts = b.basename.toLowerCase().startsWith(query);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.basename.localeCompare(b.basename);
        })
        .slice(0, 8);
      setWlSuggestions(filtered);
      setWlIndex(0);
    } else {
      setWlSuggestions([]);
    }
  };

  // Insert selected file as a wikilink, replacing the [[query at cursor
  const selectWlSuggestion = (file: TFile) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const pos = ta.selectionStart ?? ta.value.length;
    const before = ta.value.slice(0, pos);
    const match = before.match(/\[\[([^\][\n|]*)$/);
    if (!match) return;

    const linkStart = pos - match[0].length; // position of the opening [[
    const newVal =
      ta.value.slice(0, linkStart) +
      '[[' + file.basename + ']]' +
      ta.value.slice(pos);

    setEditDesc(newVal);
    setWlSuggestions([]);

    const newCursor = linkStart + 2 + file.basename.length + 2;
    requestAnimationFrame(() => {
      const t = textareaRef.current;
      if (!t) return;
      t.focus();
      t.setSelectionRange(newCursor, newCursor);
      t.style.height = 'auto';
      t.style.height = t.scrollHeight + 'px';
    });
  };

  const hasAnyCards = swimlane.children.some(col => col.children.length > 0);
  const [clearedSnapshot, setClearedSnapshot] = useState<{ colIndex: number; items: any[] }[]>([]);

  const handleClear = () => {
    const snapshot = swimlane.children
      .map((col, colIndex) => ({ colIndex, items: col.children }))
      .filter(({ items }) => items.length > 0);
    setClearedSnapshot(snapshot);
    stateManager.setState((board: any) => {
      let updated = board;
      snapshot.forEach(({ colIndex }) => {
        updated = updateEntity(updated, [swimlaneIndex, colIndex], { children: { $set: [] } });
      });
      return updated;
    });
  };

  const handleUnclear = () => {
    stateManager.setState((board: any) => {
      let updated = board;
      clearedSnapshot.forEach(({ colIndex, items }) => {
        updated = updateEntity(updated, [swimlaneIndex, colIndex], { children: { $set: items } });
      });
      return updated;
    });
    setClearedSnapshot([]);
  };

  const handleReload = () => {
    const scaffold = swimlane.data.scaffold;
    if (!scaffold || scaffold.length === 0 || swimlane.children.length === 0) return;

    const summary = `Reloading ${scaffold.length} task${scaffold.length !== 1 ? 's' : ''} into "${swimlane.children[0].data.title}":\n` +
      scaffold.map((t) => `• ${t}`).join('\n');
    new Notice(summary, 5000);

    const priorityRe = /\s*\[priority::([^\]]+)\]/;
    const newItems = scaffold.map((raw) => {
      let title = raw;
      let priority: string | undefined;
      const m = title.match(priorityRe);
      if (m) {
        priority = m[1].trim();
        title = title.replace(priorityRe, '').trim();
      }
      return {
        id: generateInstanceId(),
        type: DataTypes.Item,
        accepts: [DataTypes.Item],
        children: [] as Item[],
        data: { title, checked: false, priority },
      };
    });
    stateManager.setState((board: any) =>
      updateEntity(board, [swimlaneIndex, 0], {
        children: { $push: newItems },
      })
    );
  };

  const handleDescInput = (e: Event) => {
    const ta = e.target as HTMLTextAreaElement;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
    setEditDesc(ta.value);
    updateWlSuggestions(ta);
  };

  const handleDescKeyDown = (e: KeyboardEvent) => {
    // Wikilink suggest navigation takes priority
    if (wlSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setWlIndex(i => Math.min(i + 1, wlSuggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setWlIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectWlSuggestion(wlSuggestions[wlIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setWlSuggestions([]);
        return;
      }
    }

    if (e.key === 'Escape') {
      setEditDesc(swimlane.data.description || '');
      setIsEditingDesc(false);
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      saveDescription();
    }
  };

  const data = useMemo<EntityData>(
    () => ({
      id: swimlane.id,
      type: DataTypes.Swimlane,
      accepts: [],
      win: view?.getWindow?.() || window,
    }),
    [swimlane.id]
  );

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    const menu = new Menu();
    const totalSwimlanes = stateManager.state.children.length;

    if (swimlaneIndex > 0) {
      menu.addItem((item) => {
        item
          .setTitle('Move up')
          .setIcon('lucide-arrow-up')
          .onClick(() => boardModifiers.moveSwimlane(swimlaneIndex, swimlaneIndex - 1));
      });
    }

    if (swimlaneIndex < totalSwimlanes - 1) {
      menu.addItem((item) => {
        item
          .setTitle('Move down')
          .setIcon('lucide-arrow-down')
          .onClick(() => boardModifiers.moveSwimlane(swimlaneIndex, swimlaneIndex + 1));
      });
    }

    menu.addItem((item) => {
      item
        .setTitle('Add column...')
        .setIcon('lucide-plus')
        .onClick(() => {
          const modal = new InputModal(
            stateManager.app,
            'Column name:',
            '',
            (title) => {
              if (!title?.trim()) return;
              const defaultWip = stateManager.getSetting('default-wip');
              const column = {
                ...ColumnTemplate,
                id: generateInstanceId(),
                children: [] as Item[],
                data: { title: title.trim(), wipLimit: defaultWip },
              };
              boardModifiers.addColumn([swimlaneIndex], column);
            }
          );
          modal.open();
        });
    });

    menu.addItem((item) => {
      item
        .setTitle('Rename swimlane...')
        .setIcon('lucide-edit')
        .onClick(() => {
          const modal = new InputModal(
            stateManager.app,
            'Swimlane name:',
            swimlane.data.title,
            (newTitle) => {
              if (!newTitle?.trim()) return;
              stateManager.setState((board: any) =>
                updateEntity(board, [swimlaneIndex], {
                  data: { $merge: { title: newTitle.trim() } },
                })
              );
            }
          );
          modal.open();
        });
    });

    const colourOptions: { name: string; icon: string }[] = [
      { name: 'blue',    icon: 'lucide-circle' },
      { name: 'green',   icon: 'lucide-circle' },
      { name: 'red',     icon: 'lucide-circle' },
      { name: 'orange',  icon: 'lucide-circle' },
      { name: 'purple',  icon: 'lucide-circle' },
      { name: 'pink',    icon: 'lucide-circle' },
      { name: 'cyan',    icon: 'lucide-circle' },
      { name: 'gold',    icon: 'lucide-circle' },
      { name: 'amber',   icon: 'lucide-circle' },
      { name: 'jade',    icon: 'lucide-circle' },
      { name: 'bronze',  icon: 'lucide-circle' },
      { name: 'scarlet', icon: 'lucide-circle' },
      { name: 'teal',    icon: 'lucide-circle' },
    ];

    const setColour = (color: string | undefined) => {
      stateManager.setState((board: any) =>
        updateEntity(board, [swimlaneIndex], {
          data: { $merge: { color } },
        })
      );
    };

    menu.addItem((item) => {
      const sub = (item as any).setSubmenu();
      item.setTitle('Set colour').setIcon('lucide-palette');
      for (const opt of colourOptions) {
        sub.addItem((si: any) => {
          const label = swimlane.data.color === opt.name
            ? `● ${opt.name}`
            : `○ ${opt.name}`;
          si.setTitle(label).setIcon(opt.icon).onClick(() => setColour(opt.name));
        });
      }
      sub.addSeparator();
      sub.addItem((si: any) => {
        si.setTitle('Clear colour').setIcon('lucide-x-circle').onClick(() => setColour(undefined));
      });
    });

    menu.addItem((item) => {
      item
        .setTitle('Edit scaffold...')
        .setIcon('lucide-list')
        .onClick(() => {
          const current = (swimlane.data.scaffold || []).join('\n');
          const modal = new TextareaModal(
            stateManager.app,
            'Scaffold tasks (one per line):',
            current,
            (val) => {
              if (val === null) return;
              const tasks = val.split('\n').map(t => t.trim()).filter(t => t.length > 0);
              stateManager.setState((board: any) =>
                updateEntity(board, [swimlaneIndex], {
                  data: { $merge: { scaffold: tasks.length > 0 ? tasks : undefined } },
                })
              );
            },
            {
              placeholder: 'Standup [priority::P0]\nCode review [priority::P1]\nWeekly report',
              hint: 'Add [priority::X] to set a priority, e.g. P0, P1, high, low',
            }
          );
          modal.open();
        });
    });

    menu.addItem((item) => {
      item
        .setTitle('Clear all cards')
        .setIcon('lucide-eraser')
        .onClick(() => {
          stateManager.setState((board: any) => {
            const swimlane = getEntityFromPath(board, [swimlaneIndex]);
            let updated = board;
            swimlane.children.forEach((_: any, colIndex: number) => {
              updated = updateEntity(updated, [swimlaneIndex, colIndex], { children: { $set: [] } });
            });
            return updated;
          });
        });
    });

    menu.addItem((item) => {
      item
        .setTitle('Demote to card')
        .setIcon('lucide-arrow-down-to-line')
        .onClick(() => {
          boardModifiers.demoteToCard(swimlaneIndex);
        });
    });

    menu.addItem((item) => {
      item
        .setTitle('Delete swimlane')
        .setIcon('lucide-trash')
        .onClick(() => {
          boardModifiers.deleteEntity([swimlaneIndex]);
        });
    });

    menu.showAtMouseEvent(e);
  };

  const CUSTOM_COLORS: Record<string, string> = {
    gold:    '#E8C84A',
    amber:   '#D4920A',
    jade:    '#3D7A5E',
    bronze:  '#A07830',
    scarlet: '#CC1111',
    teal:    '#2A8A8A',
  };

  const accentStyle = swimlane.data.color
    ? ({
        '--swimlane-accent': swimlane.data.color.startsWith('#')
          ? swimlane.data.color
          : CUSTOM_COLORS[swimlane.data.color]
            ? CUSTOM_COLORS[swimlane.data.color]
            : `var(--color-${swimlane.data.color})`,
      } as CSSProperties)
    : undefined;

  return (
    <div ref={measureRef} className={c('swimlane')} style={accentStyle}>
      <Droppable
        elementRef={elementRef}
        measureRef={measureRef}
        id={swimlane.id}
        index={swimlaneIndex}
        data={data}
      >
        <div ref={elementRef}>
          <div className={c('swimlane-header')} onContextMenu={handleContextMenu}>
            <button
              className={c('swimlane-collapse') + (collapsed ? ` ${c('swimlane-collapse--collapsed')}` : '')}
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand' : 'Collapse'}
            />
            <span className={c('swimlane-title')}>{swimlane.data.title}</span>
            {swimlane.data.scaffold && swimlane.data.scaffold.length > 0 && (
              <button
                className={c('swimlane-reload')}
                onClick={handleReload}
                title={`Reload into "${swimlane.children[0]?.data.title}":\n${swimlane.data.scaffold.map(t => `• ${t}`).join('\n')}`}
                data-ignore-drag
              >
                RELOAD
              </button>
            )}
            {hasAnyCards && (
              <button
                className={c('swimlane-clear')}
                onClick={handleClear}
                title="Clear all cards from this swimlane"
                data-ignore-drag
              >
                CLEAR
              </button>
            )}
            {clearedSnapshot.length > 0 && (
              <button
                className={c('swimlane-unclear')}
                onClick={handleUnclear}
                title="Undo clear and restore all cards"
                data-ignore-drag
              >
                UNCLEAR
              </button>
            )}
            <span className={c('swimlane-count')}>
              {swimlane.children.reduce((sum, col) => sum + col.children.length, 0)} cards
            </span>
          </div>

          <div className={c('swimlane-description-wrap')}>
            {isEditingDesc ? (
              <div className={c('swimlane-desc-editor-wrap')}>
                <textarea
                  ref={textareaRef}
                  className={c('swimlane-description-editor')}
                  value={editDesc}
                  onInput={handleDescInput}
                  onBlur={saveDescription}
                  onKeyDown={handleDescKeyDown}
                  placeholder="Describe the flow of this swimlane... (supports [[wiki links]])"
                  rows={2}
                />
                {wlSuggestions.length > 0 && (
                  <div className={c('wl-suggest')}>
                    {wlSuggestions.map((file, i) => (
                      <div
                        key={file.path}
                        className={
                          c('wl-suggest-item') +
                          (i === wlIndex ? ' ' + c('wl-suggest-item--active') : '')
                        }
                        onMouseDown={(e) => {
                          e.preventDefault(); // prevent textarea blur
                          selectWlSuggestion(file);
                        }}
                      >
                        <span className={c('wl-suggest-icon')}>⟦⟧</span>
                        <span className={c('wl-suggest-name')}>{file.basename}</span>
                        <span className={c('wl-suggest-path')}>
                          {file.parent?.path !== '/' ? file.parent?.path : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                className={c('swimlane-description') + (swimlane.data.description ? '' : ' ' + c('swimlane-description--empty'))}
                ref={descriptionRef}
                onClick={() => setIsEditingDesc(true)}
                title="Click to edit description"
              >
                {!swimlane.data.description && (
                  <span className={c('swimlane-description-placeholder')}>
                    Describe the flow of this swimlane...
                  </span>
                )}
              </div>
            )}
          </div>

          {!collapsed && (
            <Sortable axis="horizontal">
              <ScrollContainer
                id={swimlane.id}
                className={c('swimlane-columns')}
                triggerTypes={COLUMN_TRIGGER_TYPES}
              >
                {swimlane.children.map((column, i) => (
                  <Column
                    key={column.id}
                    column={column}
                    columnIndex={i}
                    swimlaneIndex={swimlaneIndex}
                  />
                ))}
                <SortPlaceholder
                  index={swimlane.children.length}
                  accepts={[DataTypes.Column]}
                  className={c('sort-placeholder')}
                />
              </ScrollContainer>
            </Sortable>
          )}
        </div>
      </Droppable>
    </div>
  );
}
