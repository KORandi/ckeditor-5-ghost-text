import { Command } from 'ckeditor5';

export class GhostTextInsertCommand extends Command {
	execute(value: string): void {
		const editor = this.editor;
		editor.model.change((writer) => {
			const position = editor.model.document.selection.getFirstPosition();
			if (!position) {
				return;
			}
			writer.insertText(value, position);
		});
	}
}
