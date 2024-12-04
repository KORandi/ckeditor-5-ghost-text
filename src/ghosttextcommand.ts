import { Command } from 'ckeditor5';

export class GhostTextCommand extends Command {
	public override value = '';

	public override execute( value: string ): void {
		this.value = value;
		const editor = this.editor;
		this.removeGhostText();
		editor.model.enqueueChange( { isUndoable: false }, writer => {
			const selection = editor.model.document.selection;
			const position = selection.focus;
			if ( !position ) {
				return;
			}
			writer.insertElement(
				'ghostText',
				{
					'data-value': value
				},
				position
			);
			writer.setSelection( position );
		} );
	}

	private removeGhostText(): void {
		this.editor.execute( 'ghostTextRemove' );
	}
}
