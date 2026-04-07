import { App, Modal, Setting, TextAreaComponent } from 'obsidian';

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
      setTimeout(() => {
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

    const ta = new TextAreaComponent(contentEl);
    ta.setValue(this.defaultValue).onChange((value) => {
      this.result = value;
    });
    ta.inputEl.style.width = '100%';
    ta.inputEl.style.minHeight = '140px';
    ta.inputEl.style.fontFamily = 'monospace';
    ta.inputEl.style.resize = 'vertical';
    setTimeout(() => ta.inputEl.focus(), 10);

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

  onClose() {
    this.contentEl.empty();
  }
}
