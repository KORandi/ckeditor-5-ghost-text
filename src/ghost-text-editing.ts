import {
	DiffItem,
	DomEventData,
	DowncastWriter,
	Item,
	Plugin,
	Writer,
} from 'ckeditor5';
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
		editor.conversion.for('downcast').elementToElement({
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
		const content = this.applyTextDecoration(
			modelElement.getAttribute('data-value'),
			Object.fromEntries(
				this.editor.model.document.selection.getAttributes()
			)
		);

		const attributes = { class: 'ck-ghost-text' };
		if (modelElement.hasAttribute('data-value')) {
			attributes.class += ' ck-ghost-text--with-value';
		}

		return writer.createRawElement('span', attributes, (domElement) => {
			const loading = modelElement.getAttribute('loading');
			domElement.innerHTML = loading ? loadingPrompt : content;
		});
	}

	private applyTextDecoration(
		text: string,
		cursorAttributes: Record<string, unknown>
	) {
		let wrapperContent = text;

		if (cursorAttributes.bold) {
			wrapperContent = `<b>${wrapperContent}</b>`;
		}

		if (cursorAttributes.italic) {
			wrapperContent = `<i>${wrapperContent}</i>`;
		}

		if (cursorAttributes.underline) {
			wrapperContent = `<ins>${wrapperContent}</ins>`;
		}

		return wrapperContent;
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
		editor.model.on('deleteContent', this.handleDeleteContent.bind(this));
		editor.editing.view.document.on(
			'click',
			this.handleGhostTextClick.bind(this)
		);
	}

	private async insertGhostText() {
		if (this.isLoading) return;

		this.isLoading = true;
		try {
			this.fetchedText = await this.memoFetchContent[0]();
		} catch (error) {
			this.handeInsertGhostTextError(error);
			return;
		}
		this.isLoading = false;
	}

	private removeGhostLetter(writer: Writer, changes: DiffItem[]): boolean {
		const insertedContents = this.getInsertedContents(writer, changes);
		const ghostText = this.fetchedText;

		if (insertedContents.length && ghostText) {
			for (const insertedContent of insertedContents) {
				if (
					insertedContent.is('$textProxy') &&
					insertedContent.data.toLowerCase() ===
						ghostText[0].toLowerCase()
				) {
					this.fetchedText = ghostText.substring(1);
					return true;
				}
			}
		}
		return false;
	}

	private applyGhostText() {
		const editor = this.editor;
		const value = this.fetchedText;

		this.fetchedText = '';
		editor.execute('ghostTextInsert', value);
		editor.execute('ghostTextRemove');
	}

	private handleInsertContent() {
		const editor = this.editor;
		const changes = editor.model.document.differ.getChanges();
		editor.model.enqueueChange({ isUndoable: false }, (writer) => {
			if (this.removeGhostLetter(writer, changes)) {
				return;
			} else {
				this.memoFetchContent[1].current?.abort();
			}
			this.insertWrapper.debounced();
		});
	}

	private handleDeleteContent() {
		const changes = this.editor.model.document.differ.getChanges();
		if (changes.length) {
			this.clearGhostText();
		}
	}

	private getInsertedContents(
		writer: Writer,
		changes: DiffItem[]
	): Array<Item> {
		return changes.reduce<Item[]>((acc, change) => {
			if (change.type === 'insert') {
				const { length, position } = change;
				const range = writer.createRange(
					position,
					position.getShiftedBy(length)
				);
				acc.push(...Array.from(range.getItems()));
			}
			return acc;
		}, []);
	}

	private handleSelectionChange(_, { directChange }) {
		const editor = this.editor;
		const selection = editor.model.document.selection.focus;
		if (
			directChange &&
			this.editor.model.document.selection.isCollapsed &&
			!this.isGhostText(selection.nodeAfter)
		) {
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
		this.memoFetchContent[1].current?.abort();
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

		if (!contentFetcher) {
			throw new Error('No content fetcher provided.');
		}

		try {
			// Fetch the content
			const result = await contentFetcher({ editor, signal });

			if (typeof result === 'string') {
				return result;
			} else if (result instanceof ReadableStream) {
				return await this.processStreamContent(result, signal);
			} else {
				throw new Error('Unsupported content fetcher return type.');
			}
		} catch (error) {
			this.handleFetchError(error, signal);
		}
	}

	private async processStreamContent(
		stream: ReadableStream<string>,
		signal: AbortSignal
	): Promise<string> {
		const reader = stream.getReader();
		let done = false;

		this.fetchedText = '';
		this.isLoading = true;
		while (!done) {
			if (signal.aborted) {
				this.fetchedText = '';
				break;
			}
			const { value, done: isDone } = await reader.read();
			done = isDone;

			if (this.fetchedText == '') {
				this.isLoading = false;
			}

			if (value) {
				this.fetchedText += value;
			}
		}

		return this.fetchedText;
	}

	private handleFetchError(error: any, signal: AbortSignal): void {
		if (signal.aborted) {
			console.warn('Fetch aborted:', error);
			return;
		}
		console.error('Error fetching ghost text content:', error);
	}

	private memoizedFetchContent(): [
		() => Promise<string>,
		{ current: AbortController | null }
	] {
		const lastController: { current: AbortController | null } = {
			current: null,
		};

		return [
			(): Promise<string> => {
				// cancel the previous request if it exists
				if (lastController.current) {
					lastController.current.abort();
				}

				// create a new AbortController for the current request
				const controller = new AbortController();
				lastController.current = controller;

				return this.fetchContent(controller.signal).then((result) => {
					if (controller.signal.aborted) {
						throw new Error('Fetch was cancelled');
					}
					return result;
				});
			},
			lastController,
		];
	}

	private getConfig() {
		return this.editor.config.get(`ghostText`);
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
