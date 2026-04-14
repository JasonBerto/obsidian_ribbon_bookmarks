import { App, FuzzySuggestModal, TFile } from "obsidian";

export class MarkdownFilePickerModal extends FuzzySuggestModal<TFile> {
  constructor(
    app: App,
    private readonly onPicked: (file: TFile) => void,
  ) {
    super(app);
    this.setPlaceholder("Select a note…");
  }

  getItems(): TFile[] {
    return this.app.vault.getMarkdownFiles();
  }

  getItemText(item: TFile): string {
    return item.path;
  }

  onChooseItem(item: TFile, _evt: MouseEvent | KeyboardEvent): void {
    this.onPicked(item);
  }
}
