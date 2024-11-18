import { DomEventData, DowncastWriter, Item, Plugin } from 'ckeditor5';
import loadingPrompt from '../theme/loading-prompt.svg';
import { debounce } from './utils';
import { GhostTextCommand } from './ghost-text-command';
import { GhostTextInsertCommand } from './ghost-text-insert-command';
import { GhostTextLoadingCommand } from './ghost-text-loading-command';
import { GhostTextRemoveCommand } from './ghost-text-remove-command';

const DEFAULT_KEYSTROKES = {
	insertGhostText: 'Ctrl+Alt+E',
	acceptGhostText: 'Tab',
};

const GHOST_TEXT_ATTRIBUTES = {
	allowWhere: '$text',
	isInline: true,
	isObject: true,
	isSelectable: false,
	isContent: false,
	isLimit: true,
};

export default class GhostTextEditing extends Plugin {
	private keystrokes = DEFAULT_KEYSTROKES;
	private memoFetchContent = this.memoizedFetchContent();
	private insertWrapper = debounce(
		this.insertGhostText.bind(this),
		this.getConfig()['debounceDelay']
	);

	init(): void {
		this.initializeSchema();
		this.registerKeystrokes();
		this.registerConverters();
		this.registerCommands();
		this.setupKeystrokes();
		this.attachListeners();
	}

	private initializeSchema() {
		const editor = this.editor;
		editor.model.schema.register('ghostText', GHOST_TEXT_ATTRIBUTES);
		editor.model.schema.extend('$text', { allowAttributes: 'ghostText' });
	}

	private registerKeystrokes() {
		const config = this.getConfig();
		this.keystrokes = { ...this.keystrokes, ...(config?.keystrokes || {}) };
	}

	private registerConverters() {
		const editor = this.editor;
		editor.conversion.for('editingDowncast').elementToElement({
			model: { name: 'ghostText' },
			view: this.createGhostTextView.bind(this),
		});
		editor.conversion.for('upcast').elementToElement({
			view: { name: 'span', classes: 'ghost-text' },
			model: 'ghostText',
		});
	}

	private createGhostTextView(
		modelElement,
		{ writer }: { writer: DowncastWriter }
	) {
		const attributes = { class: 'ck-ghost-text' };
		if (modelElement.hasAttribute('data-value')) {
			attributes.class += ' ck-ghost-text--with-value';
		}

		return writer.createRawElement('span', attributes, (domElement) => {
			const loading = modelElement.getAttribute('loading');
			domElement.innerHTML = loading
				? loadingPrompt
				: modelElement.getAttribute('data-value') || '';
		});
	}

	private registerCommands() {
		const editor = this.editor;
		editor.commands.add('ghostText', new GhostTextCommand(editor));
		editor.commands.add(
			'ghostTextInsert',
			new GhostTextInsertCommand(editor)
		);
		editor.commands.add(
			'ghostTextLoading',
			new GhostTextLoadingCommand(editor)
		);
		editor.commands.add(
			'ghostTextRemove',
			new GhostTextRemoveCommand(editor)
		);
	}

	private setupKeystrokes() {
		const editor = this.editor;
		editor.keystrokes.set(
			this.keystrokes.insertGhostText,
			this.handleInsertKeystroke.bind(this)
		);
		editor.keystrokes.set(
			this.keystrokes.acceptGhostText,
			this.handleAcceptKeystroke.bind(this),
			{ priority: 'high' }
		);
	}

	private handleInsertKeystroke(event, cancel) {
		event.preventDefault();
		this.insertGhostText();
		cancel();
	}

	private handleAcceptKeystroke(event, cancel) {
		if (this.isLoading || !this.fetchedText) return;

		cancel();
		event.preventDefault();
		this.applyGhostText();
	}

	private attachListeners() {
		const editor = this.editor;

		editor.model.on('insertContent', this.handleInsertContent.bind(this));
		editor.model.document.selection.on(
			'change:range',
			this.handleSelectionChange.bind(this)
		);
		editor.model.on('deleteContent', this.clearGhostText.bind(this));
		editor.editing.view.document.on(
			'click',
			this.handleGhostTextClick.bind(this)
		);
	}

	private async insertGhostText() {
		if (this.isLoading) return;

		this.isLoading = true;
		try {
			const content = await this.memoFetchContent();
			this.updateGhostText(content);
		} catch (error) {
			this.handeInsertGhostTextError(error);
			return;
		}
		this.isLoading = false;
	}

	private applyGhostText() {
		const editor = this.editor;
		const value = this.fetchedText;

		this.fetchedText = '';
		editor.execute('ghostTextInsert', value);
		editor.execute('ghostTextRemove');
	}

	private handleInsertContent() {
		this.insertWrapper.debounced();
	}

	private handleSelectionChange(_, { directChange }) {
		const editor = this.editor;
		const selection = editor.model.document.selection.focus;
		if (
			directChange &&
			this.editor.model.document.selection.isCollapsed &&
			!this.isGhostText(selection.nodeAfter)
		) {
			this.insertWrapper.cancel();
			this.clearGhostText();
		}
	}

	private handleGhostTextClick(_, domEvent: DomEventData) {
		const target = domEvent.target;

		if (target.hasClass('ck-ghost-text')) {
			this.applyGhostText();
		}
	}

	private clearGhostText() {
		this.isLoading = false;
		this.insertWrapper.cancel();
		this.editor.execute('ghostTextRemove');
	}

	private get isLoading(): boolean {
		const command = this.editor.commands.get('ghostTextLoading');
		return !!command.value;
	}

	private set isLoading(isLoading: boolean) {
		this.editor.execute('ghostTextLoading', isLoading);
	}

	private get fetchedText(): string {
		return this.editor.commands.get('ghostText').value as string;
	}

	private set fetchedText(value: string) {
		this.editor.execute('ghostText', value);
	}

	private async fetchContent(signal: AbortSignal): Promise<string> {
		const editor = this.editor;
		const contentFetcher = this.getConfig()['contentFetcher'];
		try {
			// Pass the signal to the fetcher for abort support
			return await contentFetcher({ editor, signal });
		} catch (error) {
			if (signal.aborted) {
				console.warn('Fetch aborted:', error);
				return '';
			}
			console.error('Error fetching ghost text content:', error);
			return '';
		}
	}

	private memoizedFetchContent(): () => Promise<string> {
		let lastController: AbortController | null = null;

		return (): Promise<string> => {
			// Cancel the previous request if it exists
			if (lastController) {
				lastController.abort();
				throw new Error('Fetch was cancelled');
			}

			// Create a new AbortController for the current request
			const controller = new AbortController();
			lastController = controller;

			return this.fetchContent(controller.signal).then((result) => {
				if (controller.signal.aborted) {
					throw new Error('Fetch was cancelled');
				}
				return result;
			});
		};
	}

	private getConfig() {
		return this.editor.config.get(`ghostText`);
	}

	private updateGhostText(content: string) {
		this.fetchedText = content;
		this.editor.execute('ghostText', content);
	}

	private handeInsertGhostTextError(error) {
		if (error.message === 'Fetch was cancelled') {
			console.warn(error);
		} else {
			throw error;
		}
	}

	private isGhostText(item: Item) {
		return item && item.is('element') && item.name === 'ghostText';
	}

	public static get pluginName() {
		return 'GhostTextEditing';
	}
}
