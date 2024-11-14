import type { GhostText } from './index.js';

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[ GhostText.pluginName ]: GhostText;
	}
}
