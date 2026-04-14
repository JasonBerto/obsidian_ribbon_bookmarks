import {
  MarkdownView,
  Notice,
  Plugin,
  TFile,
} from "obsidian";
import { RibbonBookmarksSettingTab } from "./settings";
import { resolveIconName } from "./icons";
import { basenameFromPath } from "./utils";
import {
  DEFAULT_SETTINGS,
  type RibbonBookmark,
  type RibbonBookmarksSettings,
} from "./types";

export default class RibbonBookmarksPlugin extends Plugin {
  settings!: RibbonBookmarksSettings;
  private ribbonIconElements: HTMLElement[] = [];

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new RibbonBookmarksSettingTab(this.app, this));

    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (!(file instanceof TFile)) return;
        let changed = false;
        for (const bm of this.settings.bookmarks) {
          if (bm.path === oldPath) {
            bm.path = file.path;
            bm.displayName = file.basename;
            changed = true;
          }
        }
        if (changed) void this.saveSettings();
      }),
    );

    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (!(file instanceof TFile)) return;
        const hit = this.settings.bookmarks.some((bm) => bm.path === file.path);
        if (hit) void this.saveSettings();
      }),
    );

    this.app.workspace.onLayoutReady(() => {
      this.refreshRibbonIcons();
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.refreshRibbonIcons();
  }

  getBookmarkTooltip(bm: RibbonBookmark): string {
    const f = this.app.vault.getAbstractFileByPath(bm.path);
    if (f instanceof TFile) {
      return f.basename;
    }
    const base = bm.displayName ?? basenameFromPath(bm.path);
    return `${base} (missing)`;
  }

  refreshRibbonIcons(): void {
    for (const el of this.ribbonIconElements) {
      el.remove();
    }
    this.ribbonIconElements = [];

    for (const bm of this.settings.bookmarks) {
      if (!bm.path) continue;
      const title = this.getBookmarkTooltip(bm);
      const iconName = resolveIconName(bm.icon);
      const el = this.addRibbonIcon(iconName, title, () => {
        void this.activateBookmark(bm);
      });
      el.addClass("ribbon-bookmarks-plugin-icon");
      if (bm.hexColor) {
        el.style.color = bm.hexColor;
      }
      this.ribbonIconElements.push(el);
    }
  }

  async activateBookmark(bm: RibbonBookmark): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(bm.path);
    if (!(file instanceof TFile)) {
      new Notice(
        `Ribbon Bookmarks: note not found — ${bm.displayName ?? basenameFromPath(bm.path)}`,
        6000,
      );
      return;
    }
    await this.openOrFocusFile(file);
  }

  async openOrFocusFile(file: TFile): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof MarkdownView && view.file?.path === file.path) {
        this.app.workspace.setActiveLeaf(leaf, { focus: true });
        return;
      }
    }

    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(file);
  }

  newBookmarkId(): string {
    return crypto.randomUUID();
  }
}
