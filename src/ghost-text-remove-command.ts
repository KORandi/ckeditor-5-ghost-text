import { Command } from 'ckeditor5';

export class GhostTextRemoveCommand extends Command {
	execute() {
		const editor = this.editor;
		const model = editor.model;
		const root = model.document.getRoot();

		if (!root) {
			return {};
		}

		const ghostTexts = Array.from(model.createRangeIn(root)).filter(
			(item) => item.item.is('element') && item.item.name === 'ghostText'
		);

		editor.model.enqueueChange({ isUndoable: false }, (writer) => {
			for (const { item } of ghostTexts) {
				writer.remove(item);
				break;
			}
		});
	}
}
