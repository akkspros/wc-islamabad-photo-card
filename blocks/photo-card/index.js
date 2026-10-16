( function ( wp ) {
	'use strict';

	var el = wp.element.createElement;
	var __ = wp.i18n.__;
	var useBlockProps = wp.blockEditor.useBlockProps;
	var InspectorControls = wp.blockEditor.InspectorControls;
	var PanelBody = wp.components.PanelBody;
	var TextControl = wp.components.TextControl;
	var ToggleControl = wp.components.ToggleControl;
	var CheckboxControl = wp.components.CheckboxControl;
	var allRoles = ( window.wcipcBlock && window.wcipcBlock.roles ) || [];

	wp.blocks.registerBlockType( 'wc-islamabad/photo-card', {
		edit: function ( props ) {
			var attrs = props.attributes;
			var selected = attrs.roles || [];

			function toggleRole( value, checked ) {
				var next = selected.filter( function ( r ) {
					return r !== value;
				} );
				if ( checked ) {
					next.push( value );
				}
				props.setAttributes( { roles: next } );
			}

			return el(
				'div',
				useBlockProps( { className: 'wcipc-editor-placeholder' } ),
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( 'Photo card settings', 'wc-islamabad-photo-card' ) },
						el( TextControl, {
							label: __( 'Heading', 'wc-islamabad-photo-card' ),
							value: attrs.title,
							onChange: function ( v ) {
								props.setAttributes( { title: v } );
							},
						} ),
						el( ToggleControl, {
							label: __( 'Show name field', 'wc-islamabad-photo-card' ),
							checked: !! attrs.showName,
							onChange: function ( v ) {
								props.setAttributes( { showName: v } );
							},
						} ),
						el( 'p', null, __( 'Roles to show (none selected = all enabled in settings)', 'wc-islamabad-photo-card' ) ),
						allRoles.map( function ( role ) {
							return el( CheckboxControl, {
								key: role.value,
								label: role.label,
								checked: selected.indexOf( role.value ) !== -1,
								onChange: function ( checked ) {
									toggleRole( role.value, checked );
								},
							} );
						} )
					)
				),
				el( 'strong', null, __( 'WordCamp Photo Card', 'wc-islamabad-photo-card' ) ),
				el(
					'p',
					null,
					__( 'The photo card maker appears here on the published page.', 'wc-islamabad-photo-card' )
				)
			);
		},
		save: function () {
			return null;
		},
	} );
} )( window.wp );
