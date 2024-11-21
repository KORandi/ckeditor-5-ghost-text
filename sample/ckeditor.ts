declare global {
	interface Window {
		editor: ClassicEditor;
	}
}

import {
	ClassicEditor,
	Autoformat,
	Base64UploadAdapter,
	BlockQuote,
	Bold,
	Code,
	CodeBlock,
	Essentials,
	Heading,
	Image,
	ImageCaption,
	ImageStyle,
	ImageToolbar,
	ImageUpload,
	Indent,
	Italic,
	Link,
	List,
	MediaEmbed,
	Paragraph,
	Table,
	TableToolbar,
} from 'ckeditor5';

import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

import GhostText from '../src/ghost-text';

import 'ckeditor5/ckeditor5.css';

ClassicEditor.create(document.getElementById('editor')!, {
	plugins: [
		GhostText,
		Essentials,
		Autoformat,
		BlockQuote,
		Bold,
		Heading,
		Image,
		ImageCaption,
		ImageStyle,
		ImageToolbar,
		ImageUpload,
		Indent,
		Italic,
		Link,
		List,
		MediaEmbed,
		Paragraph,
		Table,
		TableToolbar,
		CodeBlock,
		Code,
		Base64UploadAdapter,
	],
	toolbar: [
		'undo',
		'redo',
		'|',
		'ghostTextButton',
		'|',
		'heading',
		'|',
		'bold',
		'italic',
		'link',
		'code',
		'bulletedList',
		'numberedList',
		'|',
		'outdent',
		'indent',
		'|',
		'uploadImage',
		'blockQuote',
		'insertTable',
		'mediaEmbed',
		'codeBlock',
	],
	image: {
		toolbar: [
			'imageStyle:inline',
			'imageStyle:block',
			'imageStyle:side',
			'|',
			'imageTextAlternative',
		],
	},
	table: {
		contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
	},
	ghostText: {
		debounceDelay: 1000,
		contentFetcher: async () => {
			const stream = new ReadableStream({
				start(controller) {
					// Emit chunks of data with delays
					controller.enqueue('This ');
					setTimeout(() => controller.enqueue('is '), 500);
					setTimeout(() => controller.enqueue('an '), 1000);
					setTimeout(() => controller.enqueue('example '), 1500);
					setTimeout(() => controller.enqueue('of '), 2000);
					setTimeout(() => controller.enqueue('streaming '), 2500);
					setTimeout(() => controller.enqueue('data.'), 3000);

					// Close the stream after all chunks are sent
					setTimeout(() => controller.close(), 3500);
				},
				cancel(reason) {
					console.log('Stream canceled:', reason);
				},
			});
			return stream;
		},
	},
})
	.then((editor) => {
		window.editor = editor;
		CKEditorInspector.attach(editor);
		window.console.log('CKEditor 5 is ready.', editor);
	})
	.catch((err) => {
		window.console.error(err.stack);
	});
