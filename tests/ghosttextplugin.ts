import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { ClassicEditor, Essentials, Paragraph, Heading } from 'ckeditor5';
import GhostTextPlugin from '../src/ghosttextplugin.js';

describe( 'GhostTextPlugin', () => {
	it( 'should be named', () => {
		expect( GhostTextPlugin.pluginName ).to.equal( 'GhostTextPlugin' );
	} );

	describe( 'init()', () => {
		let domElement: HTMLElement, editor: ClassicEditor;

		beforeEach( async () => {
			domElement = document.createElement( 'div' );
			document.body.appendChild( domElement );

			editor = await ClassicEditor.create( domElement, {
				plugins: [
					Paragraph,
					Heading,
					Essentials,
					GhostTextPlugin
				],
				toolbar: [
					'ghostTextPluginButton'
				]
			} );
		} );

		afterEach( () => {
			domElement.remove();
			return editor.destroy();
		} );

		it( 'should load GhostTextPlugin', () => {
			const myPlugin = editor.plugins.get( 'GhostTextPlugin' );

			expect( myPlugin ).to.be.an.instanceof( GhostTextPlugin );
		} );

		it( 'should add an icon to the toolbar', () => {
			expect( editor.ui.componentFactory.has( 'ghostTextPluginButton' ) ).to.equal( true );
		} );

		it( 'should add a text into the editor after clicking the icon', () => {
			const icon = editor.ui.componentFactory.create( 'ghostTextPluginButton' );

			expect( editor.getData() ).to.equal( '' );

			icon.fire( 'execute' );

			expect( editor.getData() ).to.equal( '<p>Hello CKEditor 5!</p>' );
		} );
	} );
} );
