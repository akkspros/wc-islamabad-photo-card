/**
 * WordCamp Islamabad Photo Card Maker – front-end editor.
 *
 * Everything happens in the browser. The visitor's photo is drawn to a canvas
 * and never sent to a server.
 */
( function () {
	'use strict';

	var D = 1080; // Design space. All drawing uses these units, scaled to canvas size.
	var FONT = '"Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif';
	var TYPES = [ 'image/jpeg', 'image/png', 'image/webp' ];
	var ZMIN = 0.2; // Lowest zoom (lets "Auto fit" show wide or tall photos whole).
	var ZMAX = 4;

	function clamp( v, min, max ) {
		return Math.min( max, Math.max( min, v ) );
	}

	function init( root ) {
		var cfg;
		try {
			cfg = JSON.parse( root.getAttribute( 'data-config' ) );
		} catch ( e ) {
			return;
		}

		var canvas = root.querySelector( '.wcipc-canvas' );
		var ctx = canvas.getContext( '2d' );
		var fileInput = root.querySelector( '.wcipc-file' );
		var statusEl = root.querySelector( '.wcipc-status' );
		var zoomEl = root.querySelector( '.wcipc-zoom' );
		var rotateEl = root.querySelector( '.wcipc-rotate' );
		var fitBtn = root.querySelector( '.wcipc-fit' );
		var autoFitEl = root.querySelector( '.wcipc-autofit' );
		var zoomVal = root.querySelector( '.wcipc-zoom-val' );
		var rotVal = root.querySelector( '.wcipc-rot-val' );
		var saveBtn = root.querySelector( '.wcipc-save' );
		var shareBtn = root.querySelector( '.wcipc-share' );
		var nameEl = root.querySelector( '.wcipc-name' );
		var nameWrap = root.querySelector( '.wcipc-field--name' );
		var roleInputs = root.querySelectorAll( '.wcipc-roles input[type="radio"]' );
		var stage = root.querySelector( '.wcipc-stage' );
		var uploadText = root.querySelector( '.wcipc-upload-text' );

		var k = cfg.size / D;
		var colors = cfg.colors;
		var t = cfg.text;
		var i18n = cfg.i18n;

		var img = null;
		var objectUrl = '';
		var st = { x: 0, y: 0, zoom: 1, rot: 0 };
		var role = cfg.roles[ 0 ];
		var frames = {}; // slug => Image | false (failed).
		var logoImg = null;
		var lm = { monument: null, mosque: null }; // Landmark illustrations (SVG images).
		var autoFit = !! cfg.autoFit; // true = show the whole photo, no cropping.
		var raf = 0;

		/* ---------- Helpers ---------- */

		function say( msg ) {
			statusEl.textContent = msg || '';
		}

		function frameFor( r ) {
			var f = frames[ r.slug ];
			return f && f.complete ? f : null;
		}

		function photoBox( hasFrame ) {
			return hasFrame
				? { cx: D / 2, cy: D / 2, size: D, circle: false }
				: { cx: D / 2, cy: 398, size: 520, circle: true };
		}

		function enableControls( on ) {
			[ zoomEl, rotateEl, fitBtn, autoFitEl, saveBtn, shareBtn ].forEach( function ( el ) {
				if ( el ) {
					el.disabled = ! on;
				}
			} );
		}

		function schedule() {
			if ( raf ) {
				return;
			}
			raf = window.requestAnimationFrame( function () {
				raf = 0;
				updateValues();
				draw();
			} );
		}

		function updateValues() {
			if ( zoomVal ) {
				zoomVal.textContent = Math.round( st.zoom * 100 ) + '%';
			}
			if ( rotVal ) {
				rotVal.textContent = Math.round( st.rot ) + '\u00b0';
			}
		}

		function syncControls() {
			zoomEl.value = st.zoom;
			rotateEl.value = st.rot;
			updateValues();
		}

		/**
		 * Zoom at which the whole photo is visible inside the current photo area.
		 * Circle: the photo's corners touch the circle. Square (custom frame):
		 * the rotated photo's bounding box fits the square.
		 */
		function fitWholeZoom() {
			var box = photoBox( !! frameFor( role ) );
			var w = img.naturalWidth;
			var h = img.naturalHeight;
			var base = Math.max( box.size / w, box.size / h );
			var s;
			if ( box.circle ) {
				s = box.size / Math.hypot( w, h );
			} else {
				var a = ( st.rot * Math.PI ) / 180;
				var bw = Math.abs( w * Math.cos( a ) ) + Math.abs( h * Math.sin( a ) );
				var bh = Math.abs( w * Math.sin( a ) ) + Math.abs( h * Math.cos( a ) );
				s = Math.min( box.size / bw, box.size / bh );
			}
			return clamp( s / base, ZMIN, ZMAX );
		}

		/** Re-applies the chosen fit mode. keepPosition leaves the photo where the visitor put it. */
		function applyFit( keepPosition ) {
			if ( ! img ) {
				return;
			}
			if ( ! keepPosition ) {
				st.x = 0;
				st.y = 0;
			}
			st.zoom = autoFit ? fitWholeZoom() : 1;
			syncControls();
		}

		/* ---------- Drawing ---------- */

		function drawPhoto( box ) {
			if ( ! img ) {
				return;
			}
			var base = Math.max( box.size / img.naturalWidth, box.size / img.naturalHeight );
			var s = base * st.zoom;
			ctx.save();
			ctx.beginPath();
			if ( box.circle ) {
				ctx.arc( box.cx, box.cy, box.size / 2, 0, Math.PI * 2 );
			} else {
				ctx.rect( box.cx - box.size / 2, box.cy - box.size / 2, box.size, box.size );
			}
			ctx.clip();
			if ( autoFit && st.zoom < 1 ) {
				// Soft blurred backdrop so the empty areas around the whole photo look intentional.
				ctx.fillStyle = colors.dark;
				ctx.fillRect( box.cx - box.size / 2, box.cy - box.size / 2, box.size, box.size );
				if ( 'filter' in ctx ) {
					ctx.save();
					ctx.filter = 'blur(28px)';
					ctx.globalAlpha = 0.85;
					ctx.translate( box.cx, box.cy );
					ctx.scale( base * 1.25, base * 1.25 );
					ctx.drawImage( img, -img.naturalWidth / 2, -img.naturalHeight / 2 );
					ctx.restore();
				}
			}
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';
			ctx.translate( box.cx + st.x, box.cy + st.y );
			ctx.rotate( ( st.rot * Math.PI ) / 180 );
			ctx.scale( s, s );
			ctx.drawImage( img, -img.naturalWidth / 2, -img.naturalHeight / 2 );
			ctx.restore();
		}

		function fitText( text, maxWidth, startSize, weight ) {
			var size = startSize;
			ctx.font = weight + ' ' + size + 'px ' + FONT;
			while ( ctx.measureText( text ).width > maxWidth && size > 18 ) {
				size -= 2;
				ctx.font = weight + ' ' + size + 'px ' + FONT;
			}
			return size;
		}

		function setSpacing( px ) {
			if ( 'letterSpacing' in ctx ) {
				ctx.letterSpacing = px + 'px';
			}
		}

		/* ----- Colour helpers ----- */

		function rgb( hex ) {
			if ( 0 === hex.indexOf( 'rgb' ) ) {
				return hex.replace( /[^\d,]/g, '' ).split( ',' ).map( Number );
			}
			var h = hex.replace( '#', '' );
			if ( h.length === 3 ) {
				h = h.replace( /(.)/g, '$1$1' );
			}
			return [ parseInt( h.substr( 0, 2 ), 16 ), parseInt( h.substr( 2, 2 ), 16 ), parseInt( h.substr( 4, 2 ), 16 ) ];
		}

		function rgba( hex, a ) {
			var c = rgb( hex );
			return 'rgba(' + c[ 0 ] + ',' + c[ 1 ] + ',' + c[ 2 ] + ',' + a + ')';
		}

		function textOn( hex ) {
			var c = rgb( hex ).map( function ( v ) {
				v /= 255;
				return v <= 0.03928 ? v / 12.92 : Math.pow( ( v + 0.055 ) / 1.055, 2.4 );
			} );
			var l = 0.2126 * c[ 0 ] + 0.7152 * c[ 1 ] + 0.0722 * c[ 2 ];
			return l > 0.18 ? colors.dark : '#ffffff';
		}

		var CREAM = '#f6efd9';
		var SERIF = 'Georgia, "Times New Roman", serif';

		/* ----- Scene pieces ----- */

		function star( cx, cy, r ) {
			ctx.beginPath();
			for ( var i = 0; i < 16; i++ ) {
				var a = ( Math.PI * i ) / 8 - Math.PI / 2;
				var rr = i % 2 ? r * 0.62 : r;
				ctx.lineTo( cx + rr * Math.cos( a ), cy + rr * Math.sin( a ) );
			}
			ctx.closePath();
			ctx.stroke();
		}

		function drawPattern() {
			ctx.save();
			ctx.strokeStyle = 'rgba(255,255,255,0.04)';
			ctx.lineWidth = 2;
			for ( var y = 0; y < 760; y += 120 ) {
				for ( var x = 0; x < D + 120; x += 120 ) {
					star( x + ( Math.round( y / 120 ) % 2 ? 60 : 0 ), y + 60, 46 );
				}
			}
			ctx.restore();
		}

		function bird( x, y, s ) {
			ctx.beginPath();
			ctx.moveTo( x - s, y );
			ctx.quadraticCurveTo( x - s / 2, y - s * 0.75, x, y );
			ctx.quadraticCurveTo( x + s / 2, y - s * 0.75, x + s, y );
			ctx.stroke();
		}

		function tree( x, y, h ) {
			ctx.beginPath();
			ctx.moveTo( x, y - h );
			ctx.lineTo( x + h * 0.28, y - h * 0.55 );
			ctx.lineTo( x + h * 0.14, y - h * 0.55 );
			ctx.lineTo( x + h * 0.34, y - h * 0.2 );
			ctx.lineTo( x + h * 0.16, y - h * 0.2 );
			ctx.lineTo( x + h * 0.16, y );
			ctx.lineTo( x - h * 0.16, y );
			ctx.lineTo( x - h * 0.16, y - h * 0.2 );
			ctx.lineTo( x - h * 0.34, y - h * 0.2 );
			ctx.lineTo( x - h * 0.14, y - h * 0.55 );
			ctx.lineTo( x - h * 0.28, y - h * 0.55 );
			ctx.closePath();
			ctx.fill();
		}

		function minaret( x, by, h, w ) {
			ctx.fillStyle = CREAM;
			ctx.fillRect( x - w / 2, by - h, w, h );
			ctx.fillRect( x - w, by - h * 0.7, w * 2, 7 );
			ctx.fillRect( x - w, by - h * 0.9, w * 2, 7 );
			ctx.beginPath();
			ctx.moveTo( x - w / 2, by - h );
			ctx.lineTo( x, by - h - h * 0.3 );
			ctx.lineTo( x + w / 2, by - h );
			ctx.closePath();
			ctx.fill();
			ctx.fillStyle = 'rgba(0,0,0,0.14)';
			ctx.fillRect( x, by - h, w / 2, h );
		}

		/* Faisal Mosque silhouette: tent-shaped hall and four slender minarets. */
		function drawMosque( bx, by ) {
			ctx.save();
			ctx.globalAlpha = 0.72;
			minaret( bx - 112, by, 235, 12 );
			minaret( bx + 112, by, 235, 12 );
			ctx.restore();

			ctx.fillStyle = CREAM;
			ctx.beginPath();
			ctx.moveTo( bx - 150, by );
			ctx.lineTo( bx - 150, by - 58 );
			ctx.lineTo( bx - 12, by - 200 );
			ctx.lineTo( bx + 12, by - 200 );
			ctx.lineTo( bx + 150, by - 58 );
			ctx.lineTo( bx + 150, by );
			ctx.closePath();
			ctx.fill();

			ctx.fillStyle = 'rgba(0,0,0,0.13)';
			ctx.beginPath();
			ctx.moveTo( bx + 12, by - 200 );
			ctx.lineTo( bx + 150, by - 58 );
			ctx.lineTo( bx + 150, by );
			ctx.lineTo( bx, by );
			ctx.closePath();
			ctx.fill();

			ctx.fillStyle = rgba( colors.dark, 0.5 );
			ctx.beginPath();
			ctx.moveTo( bx - 42, by );
			ctx.lineTo( bx - 42, by - 52 );
			ctx.quadraticCurveTo( bx, by - 96, bx + 42, by - 52 );
			ctx.lineTo( bx + 42, by );
			ctx.closePath();
			ctx.fill();

			minaret( bx - 172, by, 262, 15 );
			minaret( bx + 172, by, 262, 15 );
		}

		function loadLandmarks() {
			if ( ! cfg.landmarks ) {
				return;
			}
			[ 'monument', 'mosque' ].forEach( function ( key ) {
				if ( ! cfg.landmarks[ key ] ) {
					return;
				}
				var im = new Image();
				im.onload = function () {
					lm[ key ] = im;
					schedule();
				};
				im.src = cfg.landmarks[ key ];
			} );
		}

		function landmarksReady() {
			return !! ( lm.monument && lm.mosque );
		}

		function ridge( y0, amp, phase, fill ) {
			ctx.fillStyle = fill;
			ctx.beginPath();
			ctx.moveTo( 0, 1080 );
			ctx.lineTo( 0, y0 );
			for ( var x = 0; x <= D; x += 40 ) {
				ctx.lineTo( x, y0 - amp * ( Math.sin( x / 130 + phase ) * 0.6 + Math.sin( x / 57 + phase * 2 ) * 0.4 ) );
			}
			ctx.lineTo( D, 1080 );
			ctx.closePath();
			ctx.fill();
		}

		function leaf( x, y, len, ang, fill ) {
			ctx.save();
			ctx.translate( x, y );
			ctx.rotate( ang );
			ctx.fillStyle = fill;
			ctx.beginPath();
			ctx.moveTo( 0, 0 );
			ctx.quadraticCurveTo( len * 0.5, -len * 0.28, len, 0 );
			ctx.quadraticCurveTo( len * 0.5, len * 0.24, 0, 0 );
			ctx.fill();
			ctx.strokeStyle = 'rgba(255,255,255,0.22)';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo( len * 0.05, 0 );
			ctx.lineTo( len * 0.9, 0 );
			ctx.stroke();
			ctx.restore();
		}

		var lmTint = {};

		/** Re-colours a landmark in misty greens (keeps its detail, drops the cream and amber). */
		function greenLandmark( key, tone, shade ) {
			if ( lmTint[ key ] ) {
				return lmTint[ key ];
			}
			var src = lm[ key ];
			var w = src.naturalWidth * 2;
			var h = src.naturalHeight * 2;
			var c = document.createElement( 'canvas' );
			c.width = w;
			c.height = h;
			var x = c.getContext( '2d' );
			x.drawImage( src, 0, 0, w, h );
			x.globalCompositeOperation = 'color';
			x.fillStyle = tone;
			x.fillRect( 0, 0, w, h );
			x.globalCompositeOperation = 'multiply';
			x.fillStyle = shade;
			x.fillRect( 0, 0, w, h );
			x.globalCompositeOperation = 'destination-in';
			x.drawImage( src, 0, 0, w, h );
			lmTint[ key ] = c;
			return c;
		}

		/** Round tree crowns in a row: the forest line of the Margalla foothills. */
		function canopy( y, r, step, fill, seed ) {
			ctx.fillStyle = fill;
			ctx.beginPath();
			ctx.moveTo( 0, 1080 );
			ctx.lineTo( 0, y );
			for ( var x = -20, i = 0; x <= D + 40; x += step, i++ ) {
				var rr = r * ( 0.7 + 0.5 * Math.abs( Math.sin( i * 1.7 + seed ) ) );
				ctx.arc( x, y + 10 * Math.sin( i * 2.3 + seed ), rr, Math.PI, 0 );
			}
			ctx.lineTo( D + 40, 1080 );
			ctx.closePath();
			ctx.fill();
		}

		function mix( hexA, hexB, t ) {
			var a = rgb( hexA );
			var b = rgb( hexB );
			return 'rgb(' + [ 0, 1, 2 ].map( function ( i ) {
				return Math.round( a[ i ] + ( b[ i ] - a[ i ] ) * t );
			} ).join( ',' ) + ')';
		}

		/** Deterministic pseudo-random number from an index, so the scene never changes between renders. */
		function hash( i, seed ) {
			var v = Math.sin( i * 127.1 + seed * 311.7 ) * 43758.5453;
			return v - Math.floor( v );
		}

		/** A soft cloud: stacked, feathered puffs. Total strength about 30% opacity. */
		function cloud( cx, cy, w ) {
			var puffs = [ [ -0.32, 0.06, 0.26 ], [ -0.12, -0.06, 0.32 ], [ 0.1, -0.02, 0.3 ], [ 0.3, 0.07, 0.24 ], [ 0, 0.1, 0.34 ] ];
			puffs.forEach( function ( q ) {
				var r = w * q[ 2 ];
				ctx.save();
				ctx.translate( cx + w * q[ 0 ], cy + w * q[ 1 ] * 0.6 );
				ctx.scale( 1, 0.62 );
				var g = ctx.createRadialGradient( 0, 0, 0, 0, 0, r );
				g.addColorStop( 0, 'rgba(255,255,255,0.34)' );
				g.addColorStop( 0.6, 'rgba(255,255,255,0.2)' );
				g.addColorStop( 1, 'rgba(255,255,255,0)' );
				ctx.fillStyle = g;
				ctx.beginPath();
				ctx.arc( 0, 0, r, 0, Math.PI * 2 );
				ctx.fill();
				ctx.restore();
			} );
		}

		/** A mountain ridge with its own light-to-haze gradient, so the hills read as receding layers. */
		function hill( y0, amp, phase, topColor, bottomColor ) {
			var g = ctx.createLinearGradient( 0, y0 - amp, 0, y0 + 260 );
			g.addColorStop( 0, topColor );
			g.addColorStop( 1, bottomColor );
			ctx.fillStyle = g;
			ctx.beginPath();
			ctx.moveTo( 0, 1080 );
			ctx.lineTo( 0, y0 );
			for ( var x = 0; x <= D; x += 12 ) {
				var n = Math.sin( x / 150 + phase ) * 0.55 + Math.sin( x / 63 + phase * 2 ) * 0.3 + Math.sin( x / 21 + phase * 3 ) * 0.08;
				ctx.lineTo( x, y0 - amp * n );
			}
			ctx.lineTo( D, 1080 );
			ctx.closePath();
			ctx.fill();
		}

		/** A band of low mist that sits between two layers. */
		function mistBand( y, h, a ) {
			var g = ctx.createLinearGradient( 0, y - h, 0, y + h );
			g.addColorStop( 0, 'rgba(240,251,244,0)' );
			g.addColorStop( 0.5, 'rgba(240,251,244,' + a + ')' );
			g.addColorStop( 1, 'rgba(240,251,244,0)' );
			ctx.fillStyle = g;
			ctx.fillRect( 0, y - h, D, h * 2 );
		}

		/** A row of pines and round-crowned trees along a ridge, filled with one gradient. */
		function forest( y, size, seed, topColor, bottomColor ) {
			var g = ctx.createLinearGradient( 0, y - size * 1.6, 0, y + 70 );
			g.addColorStop( 0, topColor );
			g.addColorStop( 1, bottomColor );
			ctx.fillStyle = g;
			ctx.beginPath();
			ctx.moveTo( -40, 1080 );
			ctx.lineTo( -40, y );
			var i = 0;
			for ( var x = -30; x < D + 40; i++ ) {
				var k = hash( i, seed );
				var sz = size * ( 0.7 + k * 0.6 );
				var base = y + ( hash( i + 40, seed ) - 0.5 ) * 14;
				if ( k > 0.8 ) {
					// Pine: tiered triangle.
					var h = sz * 1.25;
					var w = sz * 0.5;
					ctx.lineTo( x - w, base );
					ctx.lineTo( x - w * 0.5, base );
					ctx.lineTo( x - w * 0.78, base - h * 0.34 );
					ctx.lineTo( x - w * 0.34, base - h * 0.34 );
					ctx.lineTo( x - w * 0.58, base - h * 0.64 );
					ctx.lineTo( x - w * 0.18, base - h * 0.64 );
					ctx.lineTo( x, base - h );
					ctx.lineTo( x + w * 0.18, base - h * 0.64 );
					ctx.lineTo( x + w * 0.58, base - h * 0.64 );
					ctx.lineTo( x + w * 0.34, base - h * 0.34 );
					ctx.lineTo( x + w * 0.78, base - h * 0.34 );
					ctx.lineTo( x + w * 0.5, base );
					ctx.lineTo( x + w, base );
					x += w * 1.5;
				} else {
					// Broadleaf crown: lobed arc.
					var r = sz * 0.62;
					ctx.lineTo( x - r * 1.5, base );
					ctx.arc( x - r * 0.75, base - r * 0.5, r * 0.78, Math.PI * 0.95, Math.PI * 1.55 );
					ctx.arc( x, base - r * 1.05, r * 0.95, Math.PI * 1.1, Math.PI * 1.9 );
					ctx.arc( x + r * 0.78, base - r * 0.5, r * 0.78, Math.PI * 1.45, Math.PI * 2.05 );
					ctx.lineTo( x + r * 1.5, base );
					x += r * 2.1;
				}
			}
			ctx.lineTo( D + 40, y );
			ctx.lineTo( D + 40, 1080 );
			ctx.closePath();
			ctx.fill();
		}

		/** Illustrated Islamabad in misty greens on a mint-white sky: Margalla hills, Pakistan Monument, Faisal Mosque. */
		function drawLandmarksScene() {
			// Sky: pale green at the top, bright near the horizon.
			var sky = ctx.createLinearGradient( 0, 0, 0, 780 );
			sky.addColorStop( 0, '#d9ebe1' );
			sky.addColorStop( 0.45, '#eaf6ef' );
			sky.addColorStop( 1, '#f8fcf9' );
			ctx.fillStyle = sky;
			ctx.fillRect( 0, 0, D, D );

			// Soft light behind the photo.
			var glow = ctx.createRadialGradient( 700, 300, 40, 700, 300, 560 );
			glow.addColorStop( 0, 'rgba(255,255,255,0.7)' );
			glow.addColorStop( 1, 'rgba(255,255,255,0)' );
			ctx.fillStyle = glow;
			ctx.fillRect( 0, 0, D, 800 );

			cloud( 150, 330, 300 );
			cloud( 930, 300, 260 );
			cloud( 880, 120, 210 );
			cloud( 120, 520, 220 );

			ctx.strokeStyle = rgba( colors.primary, 0.5 );
			ctx.lineWidth = 3.5;
			ctx.lineCap = 'round';
			bird( 170, 215, 26 );
			bird( 235, 255, 18 );
			bird( 890, 205, 22 );

			// Margalla ridges, far to near, each hazier toward its foot.
			hill( 500, 70, 0.4, rgba( colors.primary, 0.22 ), 'rgba(240,251,244,0.6)' );
			mistBand( 560, 70, 0.55 );

			// Islamabad skyline, faint.
			ctx.fillStyle = rgba( colors.primary, 0.2 );
			[ [ 430, 60, 90 ], [ 495, 44, 60 ], [ 545, 52, 110 ], [ 600, 40, 70 ], [ 650, 56, 95 ], [ 835, 46, 80 ], [ 886, 38, 55 ] ].forEach( function ( q ) {
				ctx.fillRect( q[ 0 ], 650 - q[ 2 ], q[ 1 ], q[ 2 ] + 110 );
			} );

			hill( 595, 55, 2.1, rgba( colors.primary, 0.4 ), 'rgba(224,242,231,0.85)' );
			mistBand( 690, 60, 0.45 );

			// Landmarks stand on the middle ridge: monument left, mosque right.
			var mw = 400;
			var mh = mw * ( lm.monument.naturalHeight / lm.monument.naturalWidth );
			ctx.save();
			ctx.shadowColor = 'rgba(6,36,30,0.25)';
			ctx.shadowBlur = 24;
			ctx.shadowOffsetY = 8;
			ctx.drawImage( greenLandmark( 'monument', '#2f9a66', '#8fb8a2' ), 4, 748 - mh, mw, mh );
			var fw = 380;
			var fh = fw * ( lm.mosque.naturalHeight / lm.mosque.naturalWidth );
			ctx.drawImage( greenLandmark( 'mosque', '#1c7a50', '#6f9c86' ), D - fw - 6, 748 - fh, fw, fh );
			ctx.restore();

			hill( 705, 34, 4.0, rgba( colors.primary, 0.7 ), rgba( colors.primary, 0.95 ) );

			// Forest: a back row in the primary green, then a dark front row.
			forest( 752, 56, 1.3, mix( colors.primary, '#000000', 0.1 ), mix( colors.primary, colors.dark, 0.6 ) );
			forest( 792, 52, 4.7, mix( colors.dark, colors.primary, 0.22 ), colors.dark );

			// Ground the name and plate sit on, with a gentle lift at the top.
			var gr = ctx.createLinearGradient( 0, 800, 0, D );
			gr.addColorStop( 0, mix( colors.dark, colors.primary, 0.12 ) );
			gr.addColorStop( 1, colors.dark );
			ctx.fillStyle = gr;
			ctx.fillRect( 0, 806, D, 274 );
		}

		function drawScene() {
			if ( landmarksReady() ) {
				drawLandmarksScene();
				return;
			}
			// Sky.
			var sky = ctx.createLinearGradient( 0, 0, 0, 780 );
			sky.addColorStop( 0, colors.dark );
			sky.addColorStop( 1, colors.primary );
			ctx.fillStyle = sky;
			ctx.fillRect( 0, 0, D, D );
			drawPattern();

			// Sun.
			var sun = ctx.createRadialGradient( 880, 215, 20, 880, 215, 230 );
			sun.addColorStop( 0, rgba( colors.accent, 0.42 ) );
			sun.addColorStop( 1, rgba( colors.accent, 0 ) );
			ctx.fillStyle = sun;
			ctx.fillRect( 560, 0, 520, 460 );
			ctx.fillStyle = colors.accent;
			ctx.beginPath();
			ctx.arc( 880, 215, 58, 0, Math.PI * 2 );
			ctx.fill();

			// Birds.
			ctx.strokeStyle = 'rgba(255,255,255,0.7)';
			ctx.lineWidth = 3;
			ctx.lineCap = 'round';
			bird( 150, 210, 22 );
			bird( 205, 245, 16 );
			bird( 110, 262, 13 );

			// Far Margalla ridge.
			ctx.fillStyle = 'rgba(255,255,255,0.10)';
			ctx.beginPath();
			ctx.moveTo( 0, 1080 );
			ctx.lineTo( 0, 600 );
			ctx.bezierCurveTo( 80, 545, 150, 520, 235, 555 );
			ctx.bezierCurveTo( 320, 590, 390, 500, 480, 525 );
			ctx.bezierCurveTo( 570, 550, 650, 600, 760, 555 );
			ctx.bezierCurveTo( 860, 515, 960, 535, 1080, 575 );
			ctx.lineTo( 1080, 1080 );
			ctx.closePath();
			ctx.fill();

			drawMosque( 880, 770 );

			// Mid ridge.
			ctx.fillStyle = 'rgba(0,0,0,0.20)';
			ctx.beginPath();
			ctx.moveTo( 0, 1080 );
			ctx.lineTo( 0, 690 );
			ctx.bezierCurveTo( 110, 650, 200, 700, 320, 670 );
			ctx.bezierCurveTo( 450, 635, 560, 650, 680, 695 );
			ctx.bezierCurveTo( 790, 735, 900, 700, 1080, 690 );
			ctx.lineTo( 1080, 1080 );
			ctx.closePath();
			ctx.fill();

			// Pines.
			ctx.fillStyle = 'rgba(0,0,0,0.34)';
			tree( 70, 770, 120 );
			tree( 135, 775, 90 );
			tree( 205, 772, 105 );
			tree( 960, 775, 95 );
			tree( 1030, 772, 120 );

			// Ground panel for text.
			var ground = ctx.createLinearGradient( 0, 740, 0, D );
			ground.addColorStop( 0, 'rgba(0,0,0,0.34)' );
			ground.addColorStop( 1, 'rgba(0,0,0,0.62)' );
			ctx.fillStyle = ground;
			ctx.beginPath();
			ctx.moveTo( 0, 1080 );
			ctx.lineTo( 0, 750 );
			ctx.bezierCurveTo( 200, 715, 340, 770, 540, 745 );
			ctx.bezierCurveTo( 740, 720, 890, 768, 1080, 735 );
			ctx.lineTo( 1080, 1080 );
			ctx.closePath();
			ctx.fill();
		}

		function drawPlaceholder( box ) {
			ctx.save();
			ctx.beginPath();
			ctx.arc( box.cx, box.cy, box.size / 2, 0, Math.PI * 2 );
			ctx.fillStyle = colors.dark;
			ctx.fill();
			ctx.fillStyle = rgba( colors.primary, 0.55 );
			ctx.fill();
			ctx.clip();
			if ( ! logoImg ) {
				ctx.fillStyle = 'rgba(255,255,255,0.16)';
				ctx.beginPath();
				ctx.arc( box.cx, box.cy - 55, 84, 0, Math.PI * 2 );
				ctx.fill();
				ctx.beginPath();
				ctx.ellipse( box.cx, box.cy + 185, 165, 150, 0, 0, Math.PI * 2 );
				ctx.fill();
			}
			ctx.restore();

			var textY = box.cy + 118;
			if ( logoImg ) {
				// The real event logo sits inside the circle until a photo is added.
				drawLogoDisc( box.cx, box.cy - 38, 138 );
				textY = box.cy + 190;
			}

			ctx.textAlign = 'center';
			ctx.fillStyle = 'rgba(255,255,255,0.92)';
			var size = fitText( i18n.placeholder, logoImg ? 330 : 400, 30, 600 );
			ctx.font = '600 ' + size + 'px ' + FONT;
			ctx.fillText( i18n.placeholder, box.cx, textY );
		}

		function drawRibbon( text, color ) {
			var cy = 676;
			var h = 82;
			ctx.font = '800 40px ' + FONT;
			setSpacing( 1 );
			var w = clamp( ctx.measureText( text ).width + 140, 480, 880 );
			var x0 = ( D - w ) / 2;
			var x1 = x0 + w;
			var notch = 24;
			var top = cy - h / 2;
			var bottom = cy + h / 2;

			ctx.save();
			ctx.shadowColor = 'rgba(0,0,0,0.4)';
			ctx.shadowBlur = 22;
			ctx.shadowOffsetY = 8;
			// White text always: light role colors (gold, orange) are deepened so it stays readable.
			var fillBase = textOn( color ) === '#ffffff' ? color : mix( color, '#000000', 0.42 );
			var rg = ctx.createLinearGradient( 0, top, 0, bottom );
			rg.addColorStop( 0, mix( fillBase, '#ffffff', 0.1 ) );
			rg.addColorStop( 1, mix( fillBase, '#000000', 0.16 ) );
			ctx.fillStyle = rg;
			ctx.beginPath();
			ctx.moveTo( x0, top );
			ctx.lineTo( x1, top );
			ctx.lineTo( x1 - notch, cy );
			ctx.lineTo( x1, bottom );
			ctx.lineTo( x0, bottom );
			ctx.lineTo( x0 + notch, cy );
			ctx.closePath();
			ctx.fill();
			ctx.restore();

			ctx.lineWidth = 4;
			ctx.lineJoin = 'round';
			ctx.strokeStyle = 'rgba(255,255,255,0.92)';
			ctx.beginPath();
			ctx.moveTo( x0, top );
			ctx.lineTo( x1, top );
			ctx.lineTo( x1 - notch, cy );
			ctx.lineTo( x1, bottom );
			ctx.lineTo( x0, bottom );
			ctx.lineTo( x0 + notch, cy );
			ctx.closePath();
			ctx.stroke();

			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			var size = fitText( text, w - 110, 40, 800 );
			ctx.font = '800 ' + size + 'px ' + FONT;
			ctx.fillText( text, D / 2, cy + 2 );
			ctx.textBaseline = 'alphabetic';
			setSpacing( 0 );
		}

		/** Draws the logo so it fills a circle of radius r (works for square or round logo files). */
		function drawLogoDisc( cx, cy, r ) {
			var sc = Math.max( ( r * 2 ) / logoImg.naturalWidth, ( r * 2 ) / logoImg.naturalHeight );
			var w = logoImg.naturalWidth * sc;
			var h = logoImg.naturalHeight * sc;
			ctx.save();
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';
			ctx.beginPath();
			ctx.arc( cx, cy, r, 0, Math.PI * 2 );
			ctx.clip();
			ctx.drawImage( logoImg, cx - w / 2, cy - h / 2, w, h );
			ctx.restore();
		}

		function drawLogoBadge( cx, cy, r ) {
			ctx.save();
			ctx.shadowColor = 'rgba(0,0,0,0.35)';
			ctx.shadowBlur = 16;
			ctx.shadowOffsetY = 5;
			ctx.fillStyle = '#f6faf7';
			ctx.beginPath();
			ctx.arc( cx, cy, r + 9, 0, Math.PI * 2 );
			ctx.fill();
			ctx.restore();

			ctx.fillStyle = '#ffffff';
			ctx.beginPath();
			ctx.arc( cx, cy, r, 0, Math.PI * 2 );
			ctx.fill();

			if ( logoImg ) {
				drawLogoDisc( cx, cy, r );
			} else {
				ctx.fillStyle = colors.primary;
				ctx.beginPath();
				ctx.arc( cx, cy, r - 8, 0, Math.PI * 2 );
				ctx.fill();
				ctx.fillStyle = '#ffffff';
				ctx.textAlign = 'center';
				ctx.font = '800 54px ' + FONT;
				ctx.fillText( 'WC', cx, cy + 12 );
				ctx.font = '700 20px ' + FONT;
				setSpacing( 3 );
				ctx.fillStyle = colors.accent;
				ctx.fillText( t.line2.slice( 0, 3 ).toUpperCase(), cx, cy + 40 );
				setSpacing( 0 );
			}
		}

		function drawTitlePlate() {
			var x = 128;
			var y = 826;
			var w = 860;
			var h = 150;
			var by = y + h / 2; // Badge centre line.

			// Plate with a soft shadow.
			ctx.save();
			ctx.shadowColor = 'rgba(0,0,0,0.45)';
			ctx.shadowBlur = 26;
			ctx.shadowOffsetY = 10;
			ctx.fillStyle = '#f6faf7';
			ctx.beginPath();
			ctx.roundRect ? ctx.roundRect( x, y, w, h, 24 ) : ctx.rect( x, y, w, h );
			ctx.fill();
			ctx.restore();

			// Right panel: deep green with white date and venue, slanted edge.
			ctx.save();
			ctx.beginPath();
			ctx.roundRect ? ctx.roundRect( x, y, w, h, 24 ) : ctx.rect( x, y, w, h );
			ctx.clip();
			var pg = ctx.createLinearGradient( x + 570, y, x + w, y + h );
			pg.addColorStop( 0, '#1ba76a' );
			pg.addColorStop( 1, colors.primary );
			ctx.fillStyle = pg;
			ctx.beginPath();
			ctx.moveTo( x + 596, y );
			ctx.lineTo( x + w, y );
			ctx.lineTo( x + w, y + h );
			ctx.lineTo( x + 568, y + h );
			ctx.closePath();
			ctx.fill();
			ctx.strokeStyle = colors.accent;
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.moveTo( x + 596, y );
			ctx.lineTo( x + 568, y + h );
			ctx.stroke();
			ctx.restore();

			// Light edge so the plate stands out from the dark ground.
			ctx.strokeStyle = 'rgba(255,255,255,0.8)';
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.roundRect ? ctx.roundRect( x, y, w, h, 24 ) : ctx.rect( x, y, w, h );
			ctx.stroke();

			// Fine inner border.
			ctx.strokeStyle = rgba( colors.primary, 0.35 );
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.roundRect ? ctx.roundRect( x + 9, y + 9, w - 18, h - 18, 17 ) : ctx.rect( x + 9, y + 9, w - 18, h - 18 );
			ctx.stroke();

			// Quiet star pattern on the right, echoing the card background.
			ctx.save();
			ctx.beginPath();
			ctx.roundRect ? ctx.roundRect( x + 10, y + 10, w - 20, h - 20, 16 ) : ctx.rect( x + 10, y + 10, w - 20, h - 20 );
			ctx.clip();
			ctx.strokeStyle = rgba( colors.primary, 0.07 );
			ctx.lineWidth = 2;
			for ( var sx = x + 250; sx < x + 520; sx += 90 ) {
				star( sx, y + h / 2, 38 );
			}
			ctx.restore();

			// Title block.
			var tx = x + 168;
			ctx.textAlign = 'left';
			ctx.fillStyle = colors.dark;
			ctx.font = '800 32px ' + FONT;
			setSpacing( 9 );
			ctx.fillText( t.line1.toUpperCase(), tx, y + 58 );
			setSpacing( 0 );

			ctx.fillStyle = colors.primary;
			var size = fitText( t.line2, 350, 52, 700 );
			ctx.font = 'italic 700 ' + size + 'px ' + SERIF;
			ctx.fillText( t.line2, tx, y + 58 + size * 0.92 );

			var dx = x + 582;

			// Date and venue, stacked on the right.
			var cx = dx + ( x + w - 26 - dx ) / 2 + 1.5;
			var maxW = x + w - 26 - dx - 34;
			var venue = t.venue || '';
			var venueTop = venue;
			var venueBottom = '';
			var comma = venue.indexOf( ',' );
			if ( comma > 0 ) {
				venueTop = venue.slice( 0, comma ).trim();
				venueBottom = venue.slice( comma + 1 ).trim();
			}
			var lines = [];
			if ( t.date ) {
				lines.push( { text: t.date, weight: 800, size: 26, color: '#ffffff' } );
			}
			if ( venueTop ) {
				lines.push( { text: venueTop, weight: 600, size: 21, color: 'rgba(255,255,255,0.92)' } );
			}
			if ( venueBottom ) {
				lines.push( { text: venueBottom, weight: 600, size: 21, color: 'rgba(255,255,255,0.92)' } );
			}
			var gap = 34;
			var ly = y + h / 2 - ( ( lines.length - 1 ) * gap ) / 2 + 8;
			ctx.textAlign = 'center';
			// Venue lines share one size (the smallest that fits), so they look like a pair.
			var venueSize = 21;
			lines.forEach( function ( ln ) {
				if ( ln.weight === 600 ) {
					venueSize = Math.min( venueSize, fitText( ln.text, maxW, ln.size, ln.weight ) );
				}
			} );
			lines.forEach( function ( ln, i ) {
				var fs = ln.weight === 600 ? venueSize : fitText( ln.text, maxW, ln.size, ln.weight );
				ctx.font = ln.weight + ' ' + fs + 'px ' + FONT;
				ctx.fillStyle = ln.color;
				ctx.fillText( ln.text, cx, ly + i * gap );
			} );

			// Logo badge overlapping the left edge.
			drawLogoBadge( x + 38, by, 82 );
		}

		function drawDefaultFrame() {
			var box = photoBox( false );

			drawScene();

			// Hashtag, top left.
			if ( t.hashtag ) {
				ctx.textAlign = 'left';
				ctx.fillStyle = landmarksReady() ? colors.dark : 'rgba(255,255,255,0.95)';
				ctx.font = '700 32px ' + FONT;
				ctx.fillText( t.hashtag, 56, 78 );
			}

			// Soft halo behind the photo.
			var halo = ctx.createRadialGradient( box.cx, box.cy, 180, box.cx, box.cy, 420 );
			halo.addColorStop( 0, 'rgba(255,255,255,0.16)' );
			halo.addColorStop( 1, 'rgba(255,255,255,0)' );
			ctx.fillStyle = halo;
			ctx.fillRect( 0, 0, D, 760 );

			// Soft shadow and a fine white outer ring under the role ring.
			ctx.save();
			ctx.shadowColor = 'rgba(6,36,30,0.3)';
			ctx.shadowBlur = 36;
			ctx.shadowOffsetY = 14;
			ctx.beginPath();
			ctx.arc( box.cx, box.cy, box.size / 2 + 15, 0, Math.PI * 2 );
			ctx.lineWidth = 12;
			ctx.strokeStyle = role.color;
			ctx.stroke();
			ctx.restore();
			ctx.beginPath();
			ctx.arc( box.cx, box.cy, box.size / 2 + 26, 0, Math.PI * 2 );
			ctx.lineWidth = 3;
			ctx.strokeStyle = 'rgba(255,255,255,0.95)';
			ctx.stroke();

			// Ring, backing and photo.
			ctx.beginPath();
			ctx.arc( box.cx, box.cy, box.size / 2 + 15, 0, Math.PI * 2 );
			ctx.lineWidth = 12;
			ctx.strokeStyle = role.color;
			ctx.stroke();
			if ( img ) {
				ctx.beginPath();
				ctx.arc( box.cx, box.cy, box.size / 2 + 4, 0, Math.PI * 2 );
				ctx.fillStyle = '#ffffff';
				ctx.fill();
				drawPhoto( box );
			} else {
				drawPlaceholder( box );
			}

			drawRibbon( role.ribbon, role.color );

			// Name.
			var nm = nameEl ? nameEl.value.trim() : '';
			if ( nm ) {
				ctx.textAlign = 'center';
				ctx.fillStyle = '#ffffff';
				var ns = fitText( nm, 700, 52, 700 );
				ctx.font = '700 ' + ns + 'px ' + FONT;
				ctx.save();
				ctx.shadowColor = 'rgba(0,0,0,0.4)';
				ctx.shadowBlur = 8;
				ctx.shadowOffsetY = 2;
				ctx.fillText( nm, D / 2, 790 );
				ctx.restore();

				// Gold flourishes either side of the name.
				var nw = ctx.measureText( nm ).width / 2;
				ctx.strokeStyle = "rgba(255,255,255,0.75)";
				ctx.lineWidth = 3;
				ctx.lineCap = 'round';
				[ -1, 1 ].forEach( function ( dir ) {
					var x0 = D / 2 + dir * ( nw + 22 );
					ctx.beginPath();
					ctx.moveTo( x0, 776 );
					ctx.lineTo( x0 + dir * 64, 776 );
					ctx.stroke();
					ctx.fillStyle = "rgba(255,255,255,0.75)";
					ctx.beginPath();
					ctx.moveTo( x0 + dir * 78, 776 );
					ctx.lineTo( x0 + dir * 70, 770 );
					ctx.lineTo( x0 + dir * 62, 776 );
					ctx.lineTo( x0 + dir * 70, 782 );
					ctx.closePath();
					ctx.fill();
				} );
				ctx.fillStyle = '#ffffff';
			}

			drawTitlePlate();
		}

		function draw() {
			ctx.setTransform( k, 0, 0, k, 0, 0 );
			ctx.clearRect( 0, 0, D, D );
			var frame = frameFor( role );
			if ( frame ) {
				drawPhoto( photoBox( true ) );
				ctx.drawImage( frame, 0, 0, D, D );
			} else {
				drawDefaultFrame();
			}
		}

		/* ---------- Frames ---------- */

		function loadFrame( r ) {
			if ( ! r.frame || typeof frames[ r.slug ] !== 'undefined' ) {
				return;
			}
			var im = new Image();
			im.crossOrigin = 'anonymous';
			im.onload = function () {
				frames[ r.slug ] = im;
				updateNameVisibility();
				schedule();
			};
			im.onerror = function () {
				frames[ r.slug ] = false;
				if ( r === role ) {
					say( i18n.frameFail );
				}
				updateNameVisibility();
				schedule();
			};
			frames[ r.slug ] = im;
			im.src = r.frame;
		}

		function updateNameVisibility() {
			if ( nameWrap ) {
				nameWrap.hidden = !! frameFor( role );
			}
		}

		function selectRole( slug ) {
			for ( var i = 0; i < cfg.roles.length; i++ ) {
				if ( cfg.roles[ i ].slug === slug ) {
					role = cfg.roles[ i ];
				}
			}
			say( '' );
			loadFrame( role );
			updateNameVisibility();
			if ( autoFit ) {
				applyFit( true );
			}
			schedule();
		}

		/* ---------- Photo loading ---------- */

		function loadFile( file ) {
			if ( ! file ) {
				return;
			}
			if ( TYPES.indexOf( file.type ) === -1 ) {
				say( i18n.badType );
				return;
			}
			if ( file.size > cfg.maxBytes ) {
				say( i18n.tooLarge.replace( '%s', Math.round( cfg.maxBytes / 1048576 ) + ' MB' ) );
				return;
			}
			var url = URL.createObjectURL( file );
			var im = new Image();
			im.onload = function () {
				if ( objectUrl ) {
					URL.revokeObjectURL( objectUrl );
				}
				objectUrl = url;
				img = im;
				st = { x: 0, y: 0, zoom: 1, rot: 0 };
				applyFit( false );
				syncControls();
				enableControls( true );
				stage.classList.add( 'has-photo' );
				if ( uploadText && i18n.changePhoto ) {
					uploadText.textContent = i18n.changePhoto;
				}
				say( i18n.ready );
				schedule();
			};
			im.onerror = function () {
				URL.revokeObjectURL( url );
				say( i18n.loadFail );
			};
			im.src = url;
		}

		/* ---------- Pointer, wheel and keyboard ---------- */

		var pointers = new Map();
		var pinch = null;

		function pointerDistance() {
			var pts = Array.from( pointers.values() );
			return Math.hypot( pts[ 0 ].x - pts[ 1 ].x, pts[ 0 ].y - pts[ 1 ].y );
		}

		canvas.addEventListener( 'pointerdown', function ( e ) {
			if ( ! img ) {
				return;
			}
			canvas.setPointerCapture( e.pointerId );
			pointers.set( e.pointerId, { x: e.clientX, y: e.clientY } );
			if ( pointers.size === 2 ) {
				pinch = { dist: pointerDistance(), zoom: st.zoom };
			}
			canvas.classList.add( 'is-dragging' );
		} );

		canvas.addEventListener( 'pointermove', function ( e ) {
			if ( ! pointers.has( e.pointerId ) ) {
				return;
			}
			var prev = pointers.get( e.pointerId );
			pointers.set( e.pointerId, { x: e.clientX, y: e.clientY } );
			if ( pointers.size === 1 ) {
				var scale = D / canvas.getBoundingClientRect().width;
				st.x = clamp( st.x + ( e.clientX - prev.x ) * scale, -D, D );
				st.y = clamp( st.y + ( e.clientY - prev.y ) * scale, -D, D );
			} else if ( pointers.size === 2 && pinch && pinch.dist > 0 ) {
				st.zoom = clamp( pinch.zoom * ( pointerDistance() / pinch.dist ), ZMIN, ZMAX );
				zoomEl.value = st.zoom;
			}
			schedule();
		} );

		function endPointer( e ) {
			pointers.delete( e.pointerId );
			if ( pointers.size < 2 ) {
				pinch = null;
			}
			if ( pointers.size === 0 ) {
				canvas.classList.remove( 'is-dragging' );
			}
		}
		canvas.addEventListener( 'pointerup', endPointer );
		canvas.addEventListener( 'pointercancel', endPointer );

		canvas.addEventListener(
			'wheel',
			function ( e ) {
				if ( ! img ) {
					return;
				}
				e.preventDefault();
				st.zoom = clamp( st.zoom * ( e.deltaY < 0 ? 1.06 : 1 / 1.06 ), ZMIN, ZMAX );
				zoomEl.value = st.zoom;
				schedule();
			},
			{ passive: false }
		);

		canvas.addEventListener( 'keydown', function ( e ) {
			if ( ! img ) {
				return;
			}
			var step = e.shiftKey ? 40 : 10;
			var handled = true;
			switch ( e.key ) {
				case 'ArrowLeft':
					st.x -= step;
					break;
				case 'ArrowRight':
					st.x += step;
					break;
				case 'ArrowUp':
					st.y -= step;
					break;
				case 'ArrowDown':
					st.y += step;
					break;
				case '+':
				case '=':
					st.zoom = clamp( st.zoom + 0.05, ZMIN, ZMAX );
					break;
				case '-':
					st.zoom = clamp( st.zoom - 0.05, ZMIN, ZMAX );
					break;
				case '[':
					st.rot = clamp( st.rot - 2, -180, 180 );
					break;
				case ']':
					st.rot = clamp( st.rot + 2, -180, 180 );
					break;
				default:
					handled = false;
			}
			if ( handled ) {
				e.preventDefault();
				if ( autoFit && ( e.key === '[' || e.key === ']' ) ) {
					applyFit( true );
				}
				syncControls();
				schedule();
			}
		} );

		/* Drag and drop a file onto the preview. */
		[ 'dragenter', 'dragover' ].forEach( function ( type ) {
			stage.addEventListener( type, function ( e ) {
				e.preventDefault();
				stage.classList.add( 'is-drop' );
			} );
		} );
		[ 'dragleave', 'drop' ].forEach( function ( type ) {
			stage.addEventListener( type, function ( e ) {
				e.preventDefault();
				stage.classList.remove( 'is-drop' );
			} );
		} );
		stage.addEventListener( 'drop', function ( e ) {
			if ( e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[ 0 ] ) {
				loadFile( e.dataTransfer.files[ 0 ] );
			}
		} );

		/* ---------- Controls ---------- */

		fileInput.addEventListener( 'change', function () {
			loadFile( fileInput.files && fileInput.files[ 0 ] );
			fileInput.value = '';
		} );

		zoomEl.addEventListener( 'input', function () {
			st.zoom = parseFloat( zoomEl.value );
			schedule();
		} );

		rotateEl.addEventListener( 'input', function () {
			st.rot = parseFloat( rotateEl.value );
			if ( autoFit ) {
				applyFit( true );
			}
			schedule();
		} );

		// Reset position, rotation and zoom (to the current fit mode).
		fitBtn.addEventListener( 'click', function () {
			st = { x: 0, y: 0, zoom: 1, rot: 0 };
			applyFit( false );
			syncControls();
			schedule();
		} );

		if ( autoFitEl ) {
			autoFitEl.checked = autoFit;
			autoFitEl.addEventListener( 'change', function () {
				autoFit = autoFitEl.checked;
				applyFit( false );
				schedule();
			} );
		}

		Array.prototype.forEach.call( roleInputs, function ( input ) {
			input.addEventListener( 'change', function () {
				if ( input.checked ) {
					selectRole( input.value );
				}
			} );
		} );

		if ( nameEl ) {
			nameEl.placeholder = i18n.namePlaceholder;
			nameEl.addEventListener( 'input', schedule );
		}

		/* ---------- Export and share ---------- */

		function fileName() {
			return 'wordcamp-islamabad-2026-' + role.slug + '.png';
		}

		function toBlob() {
			return new Promise( function ( resolve, reject ) {
				try {
					draw();
					canvas.toBlob( function ( blob ) {
						return blob ? resolve( blob ) : reject( new Error( 'empty' ) );
					}, 'image/png' );
				} catch ( err ) {
					reject( err );
				}
			} );
		}

		function download( blob ) {
			var url = URL.createObjectURL( blob );
			var a = document.createElement( 'a' );
			a.href = url;
			a.download = fileName();
			document.body.appendChild( a );
			a.click();
			document.body.removeChild( a );
			window.setTimeout( function () {
				URL.revokeObjectURL( url );
			}, 2000 );
		}

		function shareMessage() {
			return cfg.share.text
				.replace( /\{ribbon\}/g, role.ribbon )
				.replace( /\{role\}/g, role.label )
				.replace( /\{hashtag\}/g, t.hashtag )
				.replace( /\{url\}/g, cfg.share.url )
				.trim();
		}

		saveBtn.addEventListener( 'click', function () {
			toBlob().then(
				function ( blob ) {
					download( blob );
					say( i18n.saved );
				},
				function () {
					say( i18n.exportFail );
				}
			);
		} );

		shareBtn.addEventListener( 'click', function () {
			toBlob().then(
				function ( blob ) {
					var file;
					try {
						file = new File( [ blob ], fileName(), { type: 'image/png' } );
					} catch ( err ) {
						file = null;
					}
					var data = { files: [ file ], text: shareMessage(), title: t.line1 + ' ' + t.line2 };
					if ( file && navigator.canShare && navigator.canShare( data ) && navigator.share ) {
						return navigator.share( data ).then( function () {
							say( i18n.shared );
						} );
					}
					download( blob );
					if ( navigator.clipboard && navigator.clipboard.writeText ) {
						return navigator.clipboard.writeText( shareMessage() ).then(
							function () {
								say( i18n.shareCopied );
							},
							function () {
								say( i18n.shareSaved );
							}
						);
					}
					say( i18n.shareSaved );
				},
				function () {
					say( i18n.exportFail );
				}
			).catch( function ( err ) {
				// The visitor closing the share sheet is not an error.
				if ( err && err.name === 'AbortError' ) {
					return;
				}
				say( i18n.exportFail );
			} );
		} );

		/* ---------- Start ---------- */

		if ( cfg.logo ) {
			var lg = new Image();
			lg.crossOrigin = 'anonymous';
			lg.onload = function () {
				logoImg = lg;
				schedule();
			};
			lg.src = cfg.logo;
		}

		cfg.roles.forEach( loadFrame );
		loadLandmarks();
		updateNameVisibility();
		draw();
	}

	function boot() {
		var apps = document.querySelectorAll( '.wcipc-app' );
		Array.prototype.forEach.call( apps, init );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', boot );
	} else {
		boot();
	}
} )();
