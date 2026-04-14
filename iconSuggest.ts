import {
  AbstractInputSuggest,
  App,
  IconName,
  prepareFuzzySearch,
  setIcon,
  getIconIds,
} from "obsidian";

const sortedIconIds: string[] = (getIconIds() as unknown as string[]).slice().sort();

/**
 * Type-ahead search for Obsidian Lucide icon ids, with fuzzy filtering and a small preview in each suggestion row.
 */
export class LucideIconInputSuggest extends AbstractInputSuggest<string> {
  constructor(app: App, inputEl: HTMLInputElement) {
    super(app, inputEl);
    this.limit = 100;
  }

  protected getSuggestions(query: string): string[] {
    const q = query.trim().toLowerCase();
    if (!q) {
      return sortedIconIds.slice(0, this.limit);
    }
    const fuzzy = prepareFuzzySearch(q);
    const matches: { id: string; score: number }[] = [];
    for (const id of sortedIconIds) {
      const m = fuzzy(id);
      if (m) matches.push({ id, score: m.score });
    }
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, this.limit).map((m) => m.id);
  }

  renderSuggestion(iconId: string, el: HTMLElement): void {
    el.empty();
    el.addClass("ribbon-bookmarks-icon-suggestion");
    const row = el.createDiv({ cls: "ribbon-bookmarks-icon-suggestion-row" });
    const preview = row.createDiv({ cls: "ribbon-bookmarks-icon-suggestion-preview" });
    setIcon(preview, iconId as IconName);
    row.createSpan({ cls: "ribbon-bookmarks-icon-suggestion-name", text: iconId });
  }
}
