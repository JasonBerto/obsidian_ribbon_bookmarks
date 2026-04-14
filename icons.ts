import { IconName, getIconIds, setIcon } from "obsidian";

let iconIdSet: Set<string> | null = null;

export function getValidIconSet(): Set<string> {
  if (!iconIdSet) {
    iconIdSet = new Set(getIconIds() as unknown as string[]);
  }
  return iconIdSet;
}

export function isValidIconName(name: string): boolean {
  return getValidIconSet().has(name);
}

export function resolveIconName(name: string): IconName {
  const fallback: IconName = "bookmark";
  if (isValidIconName(name)) {
    return name as IconName;
  }
  return fallback;
}

export function updateIconPreview(el: HTMLElement, iconName: string): void {
  el.empty();
  setIcon(el, resolveIconName(iconName));
}
