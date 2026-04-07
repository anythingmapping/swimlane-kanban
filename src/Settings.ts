import { App, PluginSettingTab, Setting } from 'obsidian';

import SwimlaneKanbanPlugin from './main';
import { SwimlaneKanbanSettings } from './types';
import { THEMES, DEFAULT_THEME } from './themes';

export class SwimlaneKanbanSettingsTab extends PluginSettingTab {
  plugin: SwimlaneKanbanPlugin;

  constructor(app: App, plugin: SwimlaneKanbanPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName('Swimlane Kanban').setHeading();

    new Setting(containerEl)
      .setName('Theme')
      .setDesc('Visual theme for the kanban board')
      .addDropdown((dd) => {
        for (const [id, theme] of Object.entries(THEMES)) {
          dd.addOption(id, theme.label);
        }
        dd.setValue(this.plugin.settings.theme || DEFAULT_THEME);
        dd.onChange(async (value) => {
          this.plugin.settings.theme = value;
          await this.plugin.saveSettings();
          this.plugin.applyTheme();
        });
      });

    new Setting(containerEl)
      .setName('Column width')
      .setDesc('Default width of columns in pixels')
      .addText((text) =>
        text
          .setPlaceholder('272')
          .setValue(String(this.plugin.settings['column-width'] || 272))
          .onChange(async (value) => {
            this.plugin.settings['column-width'] = parseInt(value, 10) || 272;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Default columns')
      .setDesc('Comma-separated list of default column names for new swimlanes')
      .addText((text) =>
        text
          .setPlaceholder('To Do, In Progress, Done')
          .setValue((this.plugin.settings['default-columns'] || ['To Do', 'In Progress', 'Done']).join(', '))
          .onChange(async (value) => {
            this.plugin.settings['default-columns'] = value.split(',').map((s) => s.trim()).filter(Boolean);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Default WIP limit')
      .setDesc('Default WIP limit for new columns (leave empty for no limit)')
      .addText((text) =>
        text
          .setPlaceholder('')
          .setValue(this.plugin.settings['default-wip'] ? String(this.plugin.settings['default-wip']) : '')
          .onChange(async (value) => {
            const parsed = parseInt(value, 10);
            this.plugin.settings['default-wip'] = isNaN(parsed) ? undefined : parsed;
            await this.plugin.saveSettings();
          })
      );
  }
}
