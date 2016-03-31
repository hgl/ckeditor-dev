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

		var colors = config.colorButton_colors.map(function (color) {
			return color[0]
		});
		colors.push('custom1', 'custom2')
		colors.unshift('default')

		var iconColors = config.colorButton_colors.map(function (color) {
			return color[1]
		});
		iconColors.unshift(null)
		var classNames = colors.map(function (color) {
			return config.colorButton_colorClassNamePattern.replace('%s', color)
		});

		if ( !CKEDITOR.env.hc ) {
			addButton( 'TextColor', 'fore', '', 10 );
		}

		var customColorRowId = CKEDITOR.tools.getNextId() + '_customColor';
		var customColorIds = {
			custom1: CKEDITOR.tools.getNextId() + '_customColor',
			custom2: CKEDITOR.tools.getNextId() + '_customColor'
		};

		var defaultColor

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
				modes: { wysiwyg: 1 },
				editorFocus: 0,
				toolbar: 'colors,' + order,
				allowedContent: style,
				requiredContent: style,

				panel: {
					css: CKEDITOR.skin.getPath( 'editor' ),
					attributes: { role: 'listbox', 'aria-label': '' }
				},

				onRender: function() {
					if (type === 'fore') {
						editor.on('selectionChange', function() {
							var btn = editor.ui.get(name)
							var element = CKEDITOR.document.getById( btn._.id );
							var span = element.find('.cke_button_icon').getItem(0)
							var path = editor.elementPath();
							var firstBlock = path.block || path.blockLimit;
							var computedColor = firstBlock.getComputedStyle( 'color' );
							var iconStyles = config.colorButton_iconStyles(computedColor)
							span.setStyles(iconStyles)
						})
					}
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

				onOpen: function() {
					var doc = this._.panel._.iframe.getFrameDocument()

					// highlight current color
					var path = editor.elementPath();
					var firstBlock = path.block || path.blockLimit;
					var activeItem = doc.find('.cke_coloricon_active').getItem(0)
					if (activeItem) {
						activeItem.setStyles({
							color: '',
							'border-color': ''
						})
						activeItem.removeClass('cke_coloricon_active')
					}
					var colorNames = config.colorButton_colors.map(function(color) {return color[0]})
					colorNames.push('custom1', 'custom2')
					var defaultItem = doc.find('.cke_coloricon_default').getItem(0)
					defaultColor = null
					var selectedItem
					colorNames.some(function(colorName) {
						var colorClass = config.colorButton_colorClassNamePattern.replace('%s', colorName)
						if (firstBlock.hasClass(colorClass)) {
							firstBlock.removeClass(colorClass)
							defaultColor = firstBlock.getComputedStyle('color')
							firstBlock.addClass(colorClass)
							selectedItem = doc.find('.cke_coloricon_' + colorName).getItem(0)
							selectedItem.addClass('cke_coloricon_active')
							return true
						}
					})
					if (!defaultColor) {
						defaultColor = firstBlock.getComputedStyle('color')
						defaultItem.addClass('cke_coloricon_active')
						selectedItem = defaultItem
					}
					defaultItem.setStyle('background-color', defaultColor)

					if (selectedItem.getComputedStyle('background-color') === 'rgb(255, 255, 255)') {
						selectedItem.setStyles({
							color: '#ffb400',
							'border-color': '#ffb400'
						})
					}

					// enable custom color
					var customColors = config.colorButton_getCustomColors()

					var row = doc.getById( customColorRowId )
					if (!customColors) {
						row.hide();
						return;
					}
					row.show()
					doc.getById( customColorIds.custom1 ).find('.cke_colorbox').getItem(0).setStyle( 'background-color', customColors[0] );
					var c2 = doc.getById( customColorIds.custom2 )
					if (!customColors[1]) {
						c2.hide()
					} else {
						c2.show()
						c2.find('.cke_colorbox').getItem(0).setStyle( 'background-color', customColors[1] );
					}
				}
			} );
		}

		function renderColors( panel, type, colorBoxId ) {
			var output = [],
				classNamePattern = config.colorButton_colorClassNamePattern,
				// Tells if we should include "More Colors..." button.
				moreColorsEnabled = editor.plugins.colordialog && config.colorButton_enableMore !== false,
				// aria-setsize and aria-posinset attributes are used to indicate size of options, because
				// screen readers doesn't play nice with table, based layouts (#12097).
				total = colors.length + ( moreColorsEnabled ? 2 : 1 );

			var clickFn = CKEDITOR.tools.addFunction( function( color, className, type ) {
				if (config.colorButton_clickCustomColorCallback) {
					config.colorButton_clickCustomColorCallback(color)
				}
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

				var colorChecked = false
				var sameColor = false
				while ( block = iterator.getNextParagraph( 'p' ) ) {
					if ( block.isReadOnly() ) continue;
					classNames.forEach(function(name) {
						block.removeClass( name );
					})
					if ( color !== "default" ) {
						if (!colorChecked) {
							colorChecked = true
							block.addClass( className );
							color = block.getComputedStyle( 'color' );
							if (color === defaultColor) {
								sameColor = true
								block.removeClass( className );
							}
						} else if (!sameColor) {
							block.addClass( className );
						}
					}
				}

				editor.focus();
				editor.forceNextSelectionCheck();
				selection.selectBookmarks( bookmarks );

				editor.fire( 'saveSnapshot' );
			} );

			output.push( '<table style="table-layout: fixed; padding: 3px;" role="presentation" cellspacing=0 cellpadding=0>' );

			// Render the color boxes.
			for ( var i = 0; i < colors.length; i++ ) {
				var colorName = colors[ i ],
					textClassName = classNamePattern.replace('%s', colorName),
					iconClassName = 'cke_coloricon_' + colorName

				if (colorName === 'default') {
					output.push( '</tr><tr id="cke_coloricon_default">' );
				} else if (colorName === 'custom1') {
					output.push( '</tr><tr id="' + customColorRowId + '">' );
				} else if (colorName !== 'custom2' && i > 0 && (i - 1) % 4 === 0 ) {
					output.push( '</tr><tr>' );
				}

				var colorStyle = '';
				var colorId = ''
				var td = '<td>'
				var text = ''
				switch (colorName) {
				case 'default':
					td = '<td colspan="4">'
					text = '<span class="cke_coloricon_label">' + editor.lang.colorbutton.useDefault + '</span>'
					break;
				case 'custom1':
					var customClickFn = CKEDITOR.tools.addFunction(function() {
						if (config.colorButton_clickCustomColorLabelCallback) {
							config.colorButton_clickCustomColorLabelCallback()
						}
					})
					td = '<td class="cke_customcolor_label" onclick="CKEDITOR.tools.callFunction(' + customClickFn + ');" colspan="2">' + editor.lang.colorbutton.custom +'</td><td>'
					// fallthrough
				case 'custom2':
					colorId = ' id="' + customColorIds[colorName] + '"';
					break;
				default:
					colorStyle = ' style="background: ' + iconColors[i] + ';"';
					break;
				}
				output.push( td +
					'<a class="cke_colorbox" _cke_focus=1 hidefocus=true' + colorId +
						' onclick="CKEDITOR.tools.callFunction(', clickFn, ',\'', colorName, '\',\'', textClassName, '\',\'', type, '\');"' +
						' role="option" aria-posinset="', ( i + 2 ), '" aria-setsize="', total, '">' +
						'<span class="cke_colorbox ', iconClassName, '"', colorStyle, '></span>' + text +
					'</a>' +
					'</td>' );
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
CKEDITOR.config.colorButton_colors = [['white', '#fff'], ['black', '#000']];

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
