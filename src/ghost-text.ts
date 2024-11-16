import { Plugin } from 'ckeditor5';
import GhostTextEditing from './ghost-text-editing';
import '../theme/style.css';

export default class GhostText extends Plugin {
	static get requires() {
		return [GhostTextEditing];
	}

	public static get pluginName(): 'GhostText' {
		return 'GhostText';
	}
}
