import { Plugin } from 'ckeditor5';
import GhostTextEditing from './ghosttextediting.js';

export default class GhostTextPlugin extends Plugin {
	public static get requires() {
		return [ GhostTextEditing ] as const;
	}

	public static get pluginName() {
		return 'GhostTextPlugin' as const;
	}
}
