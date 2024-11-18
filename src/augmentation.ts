import { Editor } from 'ckeditor5';
import type { GhostText } from './index';

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[GhostText.pluginName]: GhostText;
	}

	// Add custom configuration options to EditorConfig
	interface EditorConfig {
		ghostText?: {
			ghostTextValue?: string;
			debounceDelay?: number;
			contentFetcher?: (props: {
				editor: Editor;
				signal: AbortSignal;
			}) => Promise<string>;
			keystrokes?: {
				insertGhostText?: string;
				acceptGhostText?: string;
			};
		};
	}
}
