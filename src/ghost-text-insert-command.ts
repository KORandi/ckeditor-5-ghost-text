import { Command } from 'ckeditor5';

export class GhostTextInsertCommand extends Command {
	execute(value: string): void {
		const editor = this.editor;
		editor.model.change((writer) => {
			const position = editor.model.document.selection.getFirstPosition();
			if (!position) {
				return;
			}
			const attributes = Object.fromEntries(
				editor.model.document.selection.getAttributes()
			);
			const textNode = writer.createText(value, attributes);

			writer.insert(textNode, position);
		});
	}
}
