/* Media picker for custom frames on the settings screen. */
( function ( $ ) {
	'use strict';

	var picker = null;

	$( document ).on( 'click', '.wcipc-select-frame', function ( e ) {
		e.preventDefault();
		var $row = $( this ).closest( '.wcipc-frame-row' );
		var library = $( this ).data( 'library' ) === 'image' ? 'image' : [ 'image/png', 'image/webp' ];

		picker = wp.media( {
			title: window.wcipcAdmin.mediaTitle,
			button: { text: window.wcipcAdmin.mediaButton },
			library: { type: library },
			multiple: false,
		} );

		picker.on( 'select', function () {
			var att = picker.state().get( 'selection' ).first().toJSON();
			var src = att.sizes && att.sizes.thumbnail ? att.sizes.thumbnail.url : att.url;
			$row.find( '.wcipc-frame-id' ).val( att.id );
			$row.find( '.wcipc-frame-preview' ).empty().append( $( '<img>' ).attr( { src: src, alt: '' } ) );
			$row.find( '.wcipc-remove-frame' ).prop( 'hidden', false );
		} );

		picker.open();
	} );

	$( document ).on( 'click', '.wcipc-remove-frame', function ( e ) {
		e.preventDefault();
		var $row = $( this ).closest( '.wcipc-frame-row' );
		$row.find( '.wcipc-frame-id' ).val( '' );
		$row.find( '.wcipc-frame-preview' ).empty();
		$( this ).prop( 'hidden', true );
	} );
} )( jQuery );
