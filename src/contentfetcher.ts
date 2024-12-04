import type { Editor } from 'ckeditor5';

export interface ContentFetcherProps {
	editor: Editor;
	signal: AbortSignal;
}
