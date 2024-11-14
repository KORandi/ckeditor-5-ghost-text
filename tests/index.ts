import { describe, expect, it } from 'vitest';
import { GhostText as GhostTextDll, icons } from '../src/index.js';
import GhostText from '../src/ghosttext.js';

import ckeditor from './../theme/icons/ckeditor.svg';

describe( 'CKEditor5 GhostText DLL', () => {
	it( 'exports GhostText', () => {
		expect( GhostTextDll ).to.equal( GhostText );
	} );

	describe( 'icons', () => {
		it( 'exports the "ckeditor" icon', () => {
			expect( icons.ckeditor ).to.equal( ckeditor );
		} );
	} );
} );
