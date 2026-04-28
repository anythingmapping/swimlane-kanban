import { App, Modal, Setting, TFile, TextAreaComponent } from 'obsidian';

export class InputModal extends Modal {
  private result: string;
  private onSubmit: (result: string | null) => void;
  private promptText: string;
  private defaultValue: string;

  constructor(
    app: App,
    promptText: string,
    defaultValue: string,
    onSubmit: (result: string | null) => void
  ) {
    super(app);
    this.promptText = promptText;
    this.defaultValue = defaultValue;
    this.result = defaultValue;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('p', { text: this.promptText });

    new Setting(contentEl).addText((text) => {
      text.setValue(this.defaultValue).onChange((value) => {
        this.result = value;
      });
      // Focus and select all on open
      activeWindow.setTimeout(() => {
        text.inputEl.focus();
        text.inputEl.select();
      }, 10);
      text.inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.close();
          this.onSubmit(this.result);
        }
      });
    });

    new Setting(contentEl)
      .addButton((btn) =>
        btn.setButtonText('OK').setCta().onClick(() => {
          this.close();
          this.onSubmit(this.result);
        })
      )
      .addButton((btn) =>
        btn.setButtonText('Cancel').onClick(() => {
          this.close();
          this.onSubmit(null);
        })
      );
  }

  onClose() {
    this.contentEl.empty();
  }
}

export class TextareaModal extends Modal {
  private result: string;
  private onSubmit: (result: string | null) => void;
  private promptText: string;
  private defaultValue: string;
  private placeholder: string;
  private hint: string;

  // Wiki-link suggest state
  private suggestEl: HTMLDivElement | null = null;
  private suggestions: TFile[] = [];
  private suggestIndex = 0;

  constructor(
    app: App,
    promptText: string,
    defaultValue: string,
    onSubmit: (result: string | null) => void,
    options?: { placeholder?: string; hint?: string }
  ) {
    super(app);
    this.promptText = promptText;
    this.defaultValue = defaultValue;
    this.result = defaultValue;
    this.onSubmit = onSubmit;
    this.placeholder = options?.placeholder || '';
    this.hint = options?.hint || '';
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('p', { text: this.promptText });
    if (this.hint) {
      const hintEl = contentEl.createEl('p', { text: this.hint });
      hintEl.addClass('swimlane-kanban__modal-hint');
    }

    // Wrapper for textarea + suggest dropdown
    const wrap = contentEl.createDiv({ cls: 'swimlane-kanban__modal-ta-wrap' });

    const ta = new TextAreaComponent(wrap);
    ta.setValue(this.defaultValue).onChange((value) => {
      this.result = value;
    });
    ta.inputEl.addClass('swimlane-kanban__modal-textarea');
    if (this.placeholder) ta.inputEl.placeholder = this.placeholder;

    // Suggest dropdown container
    this.suggestEl = wrap.createDiv({ cls: 'swimlane-kanban__wikilink-suggest swimlane-kanban__wikilink-suggest--hidden' });

    ta.inputEl.addEventListener('input', () => this.updateSuggestions(ta.inputEl));
    ta.inputEl.addEventListener('click', () => this.updateSuggestions(ta.inputEl));

    ta.inputEl.addEventListener('keydown', (e) => {
      if (this.suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.suggestIndex = Math.min(this.suggestIndex + 1, this.suggestions.length - 1);
          this.renderSuggestions(ta.inputEl);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.suggestIndex = Math.max(this.suggestIndex - 1, 0);
          this.renderSuggestions(ta.inputEl);
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          this.acceptSuggestion(ta.inputEl, this.suggestions[this.suggestIndex]);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this.clearSuggestions();
          return;
        }
      }
    });

    activeWindow.setTimeout(() => ta.inputEl.focus(), 10);

    new Setting(contentEl)
      .addButton((btn) =>
        btn.setButtonText('Save').setCta().onClick(() => {
          this.close();
          this.onSubmit(this.result);
        })
      )
      .addButton((btn) =>
        btn.setButtonText('Cancel').onClick(() => {
          this.close();
          this.onSubmit(null);
        })
      );
  }

  private updateSuggestions(el: HTMLTextAreaElement) {
    const pos = el.selectionStart ?? el.value.length;
    const before = el.value.slice(0, pos);
    const match = before.match(/\[\[([^\][\n|]*)$/);

    if (!match) {
      this.clearSuggestions();
      return;
    }

    const query = match[1].toLowerCase();
    const files = this.app.vault.getMarkdownFiles();
    this.suggestions = files
      .filter((f) => f.basename.toLowerCase().includes(query))
      .sort((a, b) => {
        const aStarts = a.basename.toLowerCase().startsWith(query);
        const bStarts = b.basename.toLowerCase().startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.basename.localeCompare(b.basename);
      })
      .slice(0, 8);

    if (this.suggestions.length === 0) {
      this.clearSuggestions();
      return;
    }

    this.suggestIndex = 0;
    this.renderSuggestions(el);
  }

  private renderSuggestions(_el: HTMLTextAreaElement) {
    if (!this.suggestEl) return;
    this.suggestEl.removeClass('swimlane-kanban__wikilink-suggest--hidden');
    this.suggestEl.empty();

    const list = this.suggestEl.createDiv({ cls: 'swimlane-kanban__wikilink-suggest-list' });
    this.suggestions.forEach((file, i) => {
      const item = list.createDiv({
        cls: 'swimlane-kanban__wikilink-suggest-item' +
          (i === this.suggestIndex ? ' swimlane-kanban__wikilink-suggest-item--selected' : ''),
      });
      item.createSpan({ cls: 'swimlane-kanban__wikilink-suggest-icon', text: '⟦⟧' });
      item.createSpan({ text: file.basename });

      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // prevent textarea blur
        this.acceptSuggestion(_el, file);
      });
    });
  }

  private acceptSuggestion(el: HTMLTextAreaElement, file: TFile) {
    const pos = el.selectionStart ?? el.value.length;
    const before = el.value.slice(0, pos);
    const match = before.match(/\[\[([^\][\n|]*)$/);
    if (!match) return;

    const linkStart = pos - match[0].length;
    const newVal =
      el.value.slice(0, linkStart) +
      '[[' + file.basename + ']]' +
      el.value.slice(pos);

    el.value = newVal;
    this.result = newVal;
    // Trigger Obsidian's TextAreaComponent onChange
    el.dispatchEvent(new Event('input'));

    const newCursor = linkStart + 2 + file.basename.length + 2;
    this.clearSuggestions();
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newCursor, newCursor);
    });
  }

  private clearSuggestions() {
    this.suggestions = [];
    this.suggestIndex = 0;
    if (this.suggestEl) {
      this.suggestEl.addClass('swimlane-kanban__wikilink-suggest--hidden');
      this.suggestEl.empty();
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}
