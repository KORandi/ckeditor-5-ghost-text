import type { GhostTextPlugin } from './index.js';

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[ GhostTextPlugin.pluginName ]: GhostTextPlugin;
	}
}
