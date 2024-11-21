import type { GhostText } from './index';
import { ContentFetcherProps } from './interfaces/content-fetcher';

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[GhostText.pluginName]: GhostText;
	}

	// Add custom configuration options to EditorConfig
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
