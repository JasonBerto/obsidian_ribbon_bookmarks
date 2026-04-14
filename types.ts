export interface RibbonBookmark {
  /** Stable id for keys and drag-and-drop identity */
  id: string;
  /** Vault-relative path to the markdown note */
  path: string;
  /** Lucide icon id (must exist in Obsidian’s icon set) */
  icon: string;
  /** `#RRGGBB` or empty string for theme default */
  hexColor: string;
  /** Cached display title; updated when the note is picked or renamed */
  displayName?: string;
}

export interface RibbonBookmarksSettings {
  bookmarks: RibbonBookmark[];
}

export const DEFAULT_SETTINGS: RibbonBookmarksSettings = {
  bookmarks: [],
};
