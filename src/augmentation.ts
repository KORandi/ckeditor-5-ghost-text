import type { ContentFetcherProps } from './contentfetcher.js';
import type { GhostTextPlugin } from './index.js';

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[GhostTextPlugin.pluginName]: GhostTextPlugin;
	}

	interface EditorConfig {
		ghostText: {
			ghostTextValue?: string;
			debounceDelay?: number;
			contentFetcher: (
				props: ContentFetcherProps
			) => Promise<string | ReadableStream<string>>;
			keystrokes?: {
				insertGhostText?: string;
				acceptGhostText?: string;
			};
		};
	}
}
