/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview The "colorbutton" plugin that makes it possible to assign
 *               text and background colors to editor contents.
 *
 */
CKEDITOR.plugins.add( 'colorbutton', {
	requires: 'panelbutton,floatpanel',
	// jscs:disable maximumLineLength
	lang: 'af,ar,bg,bn,bs,ca,cs,cy,da,de,el,en,en-au,en-ca,en-gb,eo,es,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
	// jscs:enable maximumLineLength
	icons: 'bgcolor,textcolor', // %REMOVE_LINE_CORE%
	hidpi: true, // %REMOVE_LINE_CORE%
	init: function( editor ) {
		var config = editor.config,
			lang = editor.lang.colorbutton;

		var classNames = config.colorButton_colors.map(function (color) {
			return config.colorButton_colorClassNamePattern.replace('%s', color)
		})

		if ( !CKEDITOR.env.hc ) {
			addButton( 'TextColor', 'fore', lang.textColorTitle, 10 );
			addButton( 'BGColor', 'back', lang.bgColorTitle, 20 );
		}

		function addButton( name, type, title, order ) {
			if (type === 'fore') {
				var style = {
					'caption div h1 h2 h3 h4 h5 h6 p pre td th li': {
						propertiesOnly: true,
						classes: classNames.join(',')
					}
				}
			} else {
				var style = new CKEDITOR.style( config[ 'colorButton_' + type + 'Style' ] )
			}
			var colorBoxId = CKEDITOR.tools.getNextId() + '_colorBox';

			editor.ui.add( name, CKEDITOR.UI_PANELBUTTON, {
				label: title,
				title: title,
				modes: { wysiwyg: 1 },
				editorFocus: 0,
				toolbar: 'colors,' + order,
				allowedContent: style,
				requiredContent: style,

				panel: {
					css: CKEDITOR.skin.getPath( 'editor' ),
					attributes: { role: 'listbox', 'aria-label': lang.panelTitle }
				},

				onBlock: function( panel, block ) {
					block.autoSize = true;
					block.element.addClass( 'cke_colorblock' );
					block.element.setHtml( renderColors( panel, type, colorBoxId ) );
					// The block should not have scrollbars (#5933, #6056)
					block.element.getDocument().getBody().setStyle( 'overflow', 'hidden' );

					CKEDITOR.ui.fire( 'ready', this );

					var keys = block.keys;
					var rtl = editor.lang.dir == 'rtl';
					keys[ rtl ? 37 : 39 ] = 'next'; // ARROW-RIGHT
					keys[ 40 ] = 'next'; // ARROW-DOWN
					keys[ 9 ] = 'next'; // TAB
					keys[ rtl ? 39 : 37 ] = 'prev'; // ARROW-LEFT
					keys[ 38 ] = 'prev'; // ARROW-UP
					keys[ CKEDITOR.SHIFT + 9 ] = 'prev'; // SHIFT + TAB
					keys[ 32 ] = 'click'; // SPACE
				},

				refresh: function() {
					// if ( !editor.activeFilter.check( style ) )
					// 	this.setState( CKEDITOR.TRISTATE_DISABLED );
				},

				// The automatic colorbox should represent the real color (#6010)
				onOpen: function() {

					var selection = editor.getSelection(),
						block = selection && selection.getStartElement(),
						path = editor.elementPath( block ),
						color;

					if ( !path )
						return;

					// Find the closest block element.
					block = path.block || path.blockLimit || editor.document.getBody();

					// The background color might be transparent. In that case, look up the color in the DOM tree.
					do {
						color = block && block.getComputedStyle( type == 'back' ? 'background-color' : 'color' ) || 'transparent';
					}
					while ( type == 'back' && color == 'transparent' && block && ( block = block.getParent() ) );

					// The box should never be transparent.
					if ( !color || color == 'transparent' )
						color = '#ffffff';

					return color;
				}
			} );
		}

		function renderColors( panel, type, colorBoxId ) {
			var output = [],
				colors = config.colorButton_colors,
				classNamePattern = config.colorButton_colorClassNamePattern,
				// Tells if we should include "More Colors..." button.
				moreColorsEnabled = editor.plugins.colordialog && config.colorButton_enableMore !== false,
				// aria-setsize and aria-posinset attributes are used to indicate size of options, because
				// screen readers doesn't play nice with table, based layouts (#12097).
				total = colors.length + ( moreColorsEnabled ? 2 : 1 );

			var clickFn = CKEDITOR.tools.addFunction( function( color, className, type ) {
				var applyColorStyle = arguments.callee;
				function onColorDialogClose( evt ) {
					this.removeListener( 'ok', onColorDialogClose );
					this.removeListener( 'cancel', onColorDialogClose );

					evt.name == 'ok' && applyColorStyle( this.getContentElement( 'picker', 'selectedColor' ).getValue(), type );
				}

				if ( color == '?' ) {
					editor.openDialog( 'colordialog', function() {
						this.on( 'ok', onColorDialogClose );
						this.on( 'cancel', onColorDialogClose );
					} );

					return;
				}

				editor.focus();

				panel.hide();

				var selection = editor.getSelection();
				if (!selection) {
					return;
				}

				editor.fire( 'saveSnapshot' );

				var bookmarks = selection.createBookmarks();

				var range = editor.createRange();
				range.selectNodeContents( editor.editable() );
				var iterator = range.createIterator();
				iterator.enlargeBr = true;

				while ( block = iterator.getNextParagraph( 'p' ) ) {
					if ( block.isReadOnly() ) continue;
					classNames.forEach(function(name) {
						block.removeClass( name );
					})
					if ( color !== "default" ) {
						block.addClass( className );
					}
				}

				editor.focus();
				editor.forceNextSelectionCheck();
				selection.selectBookmarks( bookmarks );

				editor.fire( 'saveSnapshot' );
			} );

			output.push( '<table role="presentation" cellspacing=0 cellpadding=0>' );

			// Render the color boxes.
			for ( var i = 0; i < colors.length; i++ ) {
				if ( ( i % 4 ) === 0 )
					output.push( '</tr><tr>' );

				var color = colors[ i ]


				var parts = color.split( '/' ),
					colorName = parts[ 0 ],
					colorCode = parts[ 1 ] || colorName,
					textClassName = classNamePattern.replace('%s', colorName),
					iconClassName = textClassName + '-ckicon'

				var colorLabel = editor.lang.colorbutton.colors[ colorCode ] || colorCode;
				colorLabel =
				output.push( '<td>' +
					'<a class="cke_colorbox" _cke_focus=1 hidefocus=true' +
						' title="', colorLabel, '"' +
						' onclick="CKEDITOR.tools.callFunction(', clickFn, ',\'', colorName, '\',\'', textClassName, '\',\'', type, '\');"' +
						' role="option" aria-posinset="', ( i + 2 ), '" aria-setsize="', total, '">' +
						'<span class="cke_colorbox ', iconClassName, '"></span>' +
					'</a>' +
					'</td>' );
			}

			// Render the "More Colors" button.
			if ( moreColorsEnabled ) {
				output.push( '</tr>' +
					'<tr>' +
						'<td colspan=8 align=center>' +
							'<a class="cke_colormore" _cke_focus=1 hidefocus=true' +
								' title="', lang.more, '"' +
								' onclick="CKEDITOR.tools.callFunction(', clickFn, ',\'?\',\'', type, '\');return false;"' +
								' href="javascript:void(\'', lang.more, '\')"', ' role="option" aria-posinset="', total, '" aria-setsize="', total, '">', lang.more, '</a>' +
						'</td>' ); // tr is later in the code.
			}

			output.push( '</tr></table>' );

			return output.join( '' );
		}

		function isUnstylable( ele ) {
			return ( ele.getAttribute( 'contentEditable' ) == 'false' ) || ele.getAttribute( 'data-nostyle' );
		}
	}
} );

/**
 * Whether to enable the **More Colors*** button in the color selectors.
 *
 *		config.colorButton_enableMore = false;
 *
 * @cfg {Boolean} [colorButton_enableMore=true]
 * @member CKEDITOR.config
 */

/**
 * Defines the colors to be displayed in the color selectors. This is a string
 * containing hexadecimal notation for HTML colors, without the `'#'` prefix.
 *
 * **Since 3.3:** A color name may optionally be defined by prefixing the entries with
 * a name and the slash character. For example, `'FontColor1/FF9900'` will be
 * displayed as the color `#FF9900` in the selector, but will be output as `'FontColor1'`.
 *
 *		// Brazil colors only.
 *		config.colorButton_colors = '00923E,F8C100,28166F';
 *
 *		config.colorButton_colors = 'FontColor1/FF9900,FontColor2/0066CC,FontColor3/F00';
 *
 * @cfg {String} [colorButton_colors=see source]
 * @member CKEDITOR.config
 */
CKEDITOR.config.colorButton_colors = ['default', 'white', 'gray', 'black'];

CKEDITOR.config.colorButton_colorClassNamePattern = '%s'

/**
 * Stores the style definition that applies the text foreground color.
 *
 *		// This is actually the default value.
 *		config.colorButton_foreStyle = {
 *			element: 'span',
 *			styles: { color: '#(color)' }
 *		};
 *
 * @cfg [colorButton_foreStyle=see source]
 * @member CKEDITOR.config
 */
CKEDITOR.config.colorButton_foreStyle = {
	element: 'span',
	styles: { 'color': '#(color)' },
	overrides: [ {
		element: 'font', attributes: { 'color': null }
	} ]
};

/**
 * Stores the style definition that applies the text background color.
 *
 *		// This is actually the default value.
 *		config.colorButton_backStyle = {
 *			element: 'span',
 *			styles: { 'background-color': '#(color)' }
 *		};
 *
 * @cfg [colorButton_backStyle=see source]
 * @member CKEDITOR.config
 */
CKEDITOR.config.colorButton_backStyle = {
	element: 'span',
	styles: { 'background-color': '#(color)' }
};
