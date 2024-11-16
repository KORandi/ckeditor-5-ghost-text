import type { GhostText } from './index';

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[GhostText.pluginName]: GhostText;
	}

	// Add custom configuration options to EditorConfig
	interface EditorConfig {
		ghostText?: {
			ghostTextValue?: string; // Default ghost text value
			debounceDelay?: number; // Debounce delay for updates
			contentFetcher?: () => Promise<string>; // Async function to fetch ghost text
			keystrokes?: {
				insertGhostText?: string;
				acceptGhostText?: string;
			};
		};
	}
}
