import { App, ButtonComponent, PluginSettingTab, Setting } from "obsidian";
import { MarkdownFilePickerModal } from "./filePicker";
import { updateIconPreview } from "./icons";
import type RibbonBookmarksPlugin from "./main";
import type { RibbonBookmark } from "./types";

export class RibbonBookmarksSettingTab extends PluginSettingTab {
  private listContainer: HTMLDivElement | null = null;

  constructor(app: App, private readonly plugin: RibbonBookmarksPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("ribbon-bookmarks-settings");

    new Setting(containerEl)
      .setName("Ribbon bookmarks")
      .setDesc(
        "Pin notes to the left ribbon. Drag rows to reorder. Click a ribbon icon to open or focus the note in a tab.",
      );

    this.listContainer = containerEl.createDiv({ cls: "ribbon-bookmarks-list" });
    this.renderBookmarkRows();

    new Setting(containerEl).addButton((btn) =>
      btn
        .setButtonText("Add bookmark")
        .setCta()
        .onClick(() => {
          const bm: RibbonBookmark = {
            id: this.plugin.newBookmarkId(),
            path: "",
            icon: "bookmark",
            hexColor: "",
          };
          this.plugin.settings.bookmarks.push(bm);
          void this.plugin.saveSettings();
          this.renderBookmarkRows();
        }),
    );
  }

  private renderBookmarkRows(): void {
    if (!this.listContainer) return;
    this.listContainer.empty();

    const bookmarks = this.plugin.settings.bookmarks;
    if (bookmarks.length === 0) {
      this.listContainer.createDiv({
        text: "No bookmarks yet. Click “Add bookmark” to create one.",
        cls: "setting-item-description",
      });
      return;
    }

    bookmarks.forEach((bm) => {
      this.renderOneRow(bm);
    });
  }

  private renderOneRow(bm: RibbonBookmark): void {
    if (!this.listContainer) return;

    const row = this.listContainer.createDiv({
      cls: "ribbon-bookmark-row",
      attr: { draggable: "true", "data-id": bm.id },
    });

    row.createSpan({ cls: "ribbon-bookmark-drag-handle", text: "⋮⋮" });

    row.addEventListener("dragstart", (e) => {
      row.addClass("dragging");
      e.dataTransfer?.setData("text/plain", bm.id);
      e.dataTransfer?.setDragImage(row, 10, 10);
    });

    row.addEventListener("dragend", () => {
      row.removeClass("dragging");
    });

    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    });

    row.addEventListener("drop", (e) => {
      e.preventDefault();
      const fromId = e.dataTransfer?.getData("text/plain");
      if (!fromId || fromId === bm.id) return;

      const arr = [...this.plugin.settings.bookmarks];
      const fromIndex = arr.findIndex((b) => b.id === fromId);
      const toIndex = arr.findIndex((b) => b.id === bm.id);
      if (fromIndex < 0 || toIndex < 0) return;

      const [removed] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, removed);
      this.plugin.settings.bookmarks = arr;
      void this.plugin.saveSettings();
      this.renderBookmarkRows();
    });

    const fields = row.createDiv({ cls: "ribbon-bookmark-fields" });

    const pathLine = fields.createDiv({ cls: "ribbon-bookmark-path" });
    const pathText =
      bm.path.length > 0 ? bm.path : "No note selected — click “Choose note”.";
    pathLine.setText(pathText);

    new Setting(fields)
      .setName("Note")
      .addButton((b: ButtonComponent) =>
        b.setButtonText("Choose note").onClick(() => {
          const modal = new MarkdownFilePickerModal(this.app, (file) => {
            bm.path = file.path;
            bm.displayName = file.basename;
            void this.plugin.saveSettings();
            this.renderBookmarkRows();
          });
          modal.open();
        }),
      );

    const iconRow = fields.createDiv({ cls: "ribbon-bookmark-icon-row" });
    const preview = iconRow.createDiv({ cls: "ribbon-bookmark-icon-preview" });
    updateIconPreview(preview, bm.icon);

    new Setting(fields)
      .setName("Lucide icon")
      .setDesc(
        "Any Obsidian Lucide icon id (e.g. bookmark, file-text, star). Invalid names fall back to “bookmark” on the ribbon.",
      )
      .addText((text) => {
        text
          .setPlaceholder("bookmark")
          .setValue(bm.icon)
          .onChange((value) => {
            bm.icon = value.trim() || "bookmark";
            updateIconPreview(preview, bm.icon);
          });
        text.inputEl.addEventListener("blur", () => {
          void this.plugin.saveSettings();
        });
      });

    const colorRow = fields.createDiv({ cls: "ribbon-bookmark-color-row" });
    colorRow.createEl("span", { text: "Color", cls: "setting-item-name" });
    const colorInput = colorRow.createEl("input", {
      type: "color",
      value: normalizeColorForInput(bm.hexColor),
    });
    colorInput.addEventListener("input", () => {
      bm.hexColor = colorInput.value === defaultColorInput() ? "" : colorInput.value;
      void this.plugin.saveSettings();
    });

    new ButtonComponent(colorRow)
      .setButtonText("Clear color")
      .onClick(() => {
        bm.hexColor = "";
        colorInput.value = defaultColorInput();
        void this.plugin.saveSettings();
        this.renderBookmarkRows();
      });

    new Setting(fields).addButton((b) =>
      b.setButtonText("Remove").onClick(() => {
        this.plugin.settings.bookmarks = this.plugin.settings.bookmarks.filter(
          (x) => x.id !== bm.id,
        );
        void this.plugin.saveSettings();
        this.renderBookmarkRows();
      }),
    );
  }
}

function defaultColorInput(): string {
  return "#7c7c7c";
}

function normalizeColorForInput(hex: string): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex;
  return defaultColorInput();
}
