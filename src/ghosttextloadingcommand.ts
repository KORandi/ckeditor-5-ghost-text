import { Command } from 'ckeditor5';

export class GhostTextLoadingCommand extends Command {
	public override value = false;

	public override execute( loadingValue: boolean ): void {
		this.value = loadingValue;
		if ( !loadingValue ) {
			return;
		}
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
					loading: loadingValue
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
