import { describe, expect, it } from 'vitest';
import { GhostTextPlugin as GhostTextPluginDll, icons } from '../src/index.js';
import GhostTextPlugin from '../src/ghosttextplugin.js';

import ckeditor from './../theme/icons/ckeditor.svg';

describe( 'CKEditor5 GhostTextPlugin DLL', () => {
	it( 'exports GhostTextPlugin', () => {
		expect( GhostTextPluginDll ).to.equal( GhostTextPlugin );
	} );

	describe( 'icons', () => {
		it( 'exports the "ckeditor" icon', () => {
			expect( icons.ckeditor ).to.equal( ckeditor );
		} );
	} );
} );
