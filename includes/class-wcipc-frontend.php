<?php
/**
 * Front-end output: shortcode, block render callback and assets.
 *
 * @package WCIPC
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class WCIPC_Frontend
 */
class WCIPC_Frontend {

	/**
	 * Hook into WordPress.
	 */
	public function register() {
		add_action( 'init', array( $this, 'register_assets' ) );
		add_action( 'init', array( $this, 'register_block' ) );
		add_shortcode( 'wcisb_photo_card', array( $this, 'shortcode' ) );
	}

	/**
	 * Registers (does not enqueue) the front-end assets. They are enqueued only
	 * when a card maker is actually rendered.
	 */
	public function register_assets() {
		wp_register_style( 'wcipc-photo-card', WCIPC_URL . 'assets/css/photo-card.css', array(), WCIPC_VERSION );
		wp_register_script(
			'wcipc-photo-card',
			WCIPC_URL . 'assets/js/photo-card.js',
			array(),
			WCIPC_VERSION,
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);
	}

	/**
	 * Registers the Gutenberg block (server-side rendered).
	 */
	public function register_block() {
		wp_register_script(
			'wcipc-block-editor',
			WCIPC_URL . 'blocks/photo-card/index.js',
			array( 'wp-blocks', 'wp-element', 'wp-i18n', 'wp-block-editor', 'wp-components' ),
			WCIPC_VERSION,
			true
		);

		$roles = array();
		foreach ( WCIPC_Settings::all_roles() as $slug => $role ) {
			$roles[] = array(
				'value' => $slug,
				'label' => $role['label'],
			);
		}
		wp_localize_script( 'wcipc-block-editor', 'wcipcBlock', array( 'roles' => $roles ) );
		wp_set_script_translations( 'wcipc-block-editor', 'wc-islamabad-photo-card', WCIPC_PATH . 'languages' );

		register_block_type(
			WCIPC_PATH . 'blocks/photo-card',
			array(
				'render_callback' => array( $this, 'render_block' ),
			)
		);
	}

	/**
	 * Shortcode handler.
	 *
	 * @param array|string $atts Shortcode attributes.
	 * @return string
	 */
	public function shortcode( $atts ) {
		$atts = shortcode_atts(
			array(
				'title'     => '',
				'roles'     => '',
				'show_name' => '',
			),
			$atts,
			'wcisb_photo_card'
		);

		$roles = '' !== $atts['roles'] ? array_filter( array_map( 'sanitize_key', explode( ',', $atts['roles'] ) ) ) : array();
		$show  = '' === $atts['show_name'] ? null : filter_var( $atts['show_name'], FILTER_VALIDATE_BOOLEAN );

		return $this->render( sanitize_text_field( $atts['title'] ), $roles, $show );
	}

	/**
	 * Block render callback.
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public function render_block( $attributes ) {
		$title = isset( $attributes['title'] ) ? sanitize_text_field( $attributes['title'] ) : '';
		$roles = isset( $attributes['roles'] ) && is_array( $attributes['roles'] ) ? array_map( 'sanitize_key', $attributes['roles'] ) : array();
		$show  = isset( $attributes['showName'] ) ? (bool) $attributes['showName'] : null;

		return $this->render( $title, $roles, $show );
	}

	/**
	 * Builds the card maker markup and enqueues assets.
	 *
	 * @param string    $title     Heading text.
	 * @param string[]  $only      Restrict to these role slugs (empty = all enabled).
	 * @param bool|null $show_name Override the name-field setting.
	 * @return string
	 */
	public function render( $title = '', $only = array(), $show_name = null ) {
		$opts      = WCIPC_Settings::get();
		$all_roles = WCIPC_Settings::all_roles();

		$enabled = array_values( array_intersect( array_keys( $all_roles ), $opts['roles'] ) );
		if ( ! empty( $only ) ) {
			$enabled = array_values( array_intersect( $enabled, $only ) );
		}
		if ( empty( $enabled ) ) {
			return current_user_can( 'edit_posts' )
				? '<p class="wcipc-notice">' . esc_html__( 'Photo card maker: no valid roles are enabled. Check the plugin settings or the roles attribute.', 'wc-islamabad-photo-card' ) . '</p>'
				: '';
		}

		$show_name = null === $show_name ? ! empty( $opts['show_name'] ) : (bool) $show_name;
		$title     = '' !== $title ? $title : __( 'Make your photo card', 'wc-islamabad-photo-card' );

		$roles_cfg = array();
		foreach ( $enabled as $slug ) {
			$frame_id    = isset( $opts['frames'][ $slug ] ) ? (int) $opts['frames'][ $slug ] : 0;
			$frame_url   = ( $frame_id && WCIPC_Settings::is_valid_frame( $frame_id ) ) ? wp_get_attachment_image_url( $frame_id, 'full' ) : '';
			$roles_cfg[] = array(
				'slug'   => $slug,
				'label'  => $all_roles[ $slug ]['label'],
				'ribbon' => $all_roles[ $slug ]['ribbon'],
				'color'  => ( ! empty( $all_roles[ $slug ]['color'] ) && sanitize_hex_color( $all_roles[ $slug ]['color'] ) ) ? $all_roles[ $slug ]['color'] : '#0f7a4a',
				'frame'  => $frame_url ? esc_url_raw( $frame_url ) : '',
			);
		}

		$config = array(
			'size'     => (int) apply_filters( 'wcipc_card_size', 1080 ),
			'logo'     => esc_url_raw( WCIPC_Settings::logo_url( 'medium' ) ),
			'autoFit'  => ! empty( $opts['auto_fit'] ),
			'landmarks'   => array(
				'monument' => WCIPC_URL . 'assets/images/landmark-pakistan-monument.svg',
				'mosque'   => WCIPC_URL . 'assets/images/landmark-faisal-mosque.svg',
			),
			'roles'    => $roles_cfg,
			'showName' => $show_name,
			'maxBytes' => (int) $opts['max_upload_mb'] * 1024 * 1024,
			'colors'   => array(
				'primary' => $opts['color_primary'],
				'dark'    => $opts['color_dark'],
				'accent'  => $opts['color_accent'],
			),
			'text'     => array(
				'line1'   => $opts['title_line_1'],
				'line2'   => $opts['title_line_2'],
				'date'    => $opts['date_text'],
				'venue'   => $opts['venue_text'],
				'hashtag' => $opts['hashtag'],
			),
			'share'    => array(
				'text' => $opts['share_text'],
				'url'  => $opts['share_url'],
			),
			'i18n'     => array(
				'placeholder' => __( 'Upload a photo to start', 'wc-islamabad-photo-card' ),
				'badType'     => __( 'Please choose a JPG, PNG or WebP image.', 'wc-islamabad-photo-card' ),
				/* translators: %s: maximum file size, e.g. "10 MB". */
				'tooLarge'    => __( 'That photo is larger than %s. Please choose a smaller one.', 'wc-islamabad-photo-card' ),
				'loadFail'    => __( 'That image could not be opened. Try a different photo.', 'wc-islamabad-photo-card' ),
				'changePhoto' => __( 'Change photo', 'wc-islamabad-photo-card' ),
				'ready'       => __( 'Photo added. Drag or pinch the card to adjust it.', 'wc-islamabad-photo-card' ),
				'saved'       => __( 'Your card was saved to your device.', 'wc-islamabad-photo-card' ),
				'shared'      => __( 'Card shared.', 'wc-islamabad-photo-card' ),
				'shareCopied' => __( 'Sharing is not available here, so the card was saved and the message was copied.', 'wc-islamabad-photo-card' ),
				'shareSaved'  => __( 'Sharing is not available here, so the card was saved instead.', 'wc-islamabad-photo-card' ),
				'frameFail'   => __( 'The custom frame could not be loaded, so the standard frame is used.', 'wc-islamabad-photo-card' ),
				'exportFail'  => __( 'The card could not be created. Please try again.', 'wc-islamabad-photo-card' ),
				'canvasLabel' => __( 'Photo card preview. Use arrow keys to move your photo, plus and minus to zoom, and square brackets to rotate.', 'wc-islamabad-photo-card' ),
				'namePlaceholder' => __( 'Your name', 'wc-islamabad-photo-card' ),
			),
		);

		wp_enqueue_style( 'wcipc-photo-card' );
		wp_enqueue_script( 'wcipc-photo-card' );

		$uid   = wp_unique_id( 'wcipc-' );
		$style = sprintf(
			'--wcipc-primary:%1$s;--wcipc-dark:%2$s;--wcipc-accent:%3$s;',
			$opts['color_primary'],
			$opts['color_dark'],
			$opts['color_accent']
		);

		ob_start();
		?>
		<div class="wcipc-app" id="<?php echo esc_attr( $uid ); ?>" style="<?php echo esc_attr( $style ); ?>" data-config="<?php echo esc_attr( wp_json_encode( $config ) ); ?>">
			<header class="wcipc-brand">
				<?php if ( $config['logo'] ) : ?>
					<img class="wcipc-brand__logo" src="<?php echo esc_url( $config['logo'] ); ?>" alt="" width="44" height="44" />
				<?php endif; ?>
				<div>
					<p class="wcipc-brand__name"><?php echo esc_html( trim( $opts['title_line_1'] . ' ' . $opts['title_line_2'] ) ); ?></p>
					<p class="wcipc-brand__meta"><?php echo esc_html( $opts['date_text'] . ' · ' . $opts['venue_text'] ); ?></p>
				</div>
			</header>

			<div class="wcipc-stage">
				<canvas class="wcipc-canvas" width="<?php echo esc_attr( $config['size'] ); ?>" height="<?php echo esc_attr( $config['size'] ); ?>" tabindex="0" role="img" aria-label="<?php echo esc_attr( $config['i18n']['canvasLabel'] ); ?>"></canvas>
				<noscript><p class="wcipc-notice"><?php esc_html_e( 'The photo card maker needs JavaScript. Please enable it and reload the page.', 'wc-islamabad-photo-card' ); ?></p></noscript>
			</div>

			<div class="wcipc-panel">
				<div class="wcipc-head">
					<h2 class="wcipc-title"><?php echo esc_html( $title ); ?></h2>
					<p class="wcipc-help"><?php esc_html_e( 'Upload a photo, then drag or pinch the card to position it. Your photo stays on your device.', 'wc-islamabad-photo-card' ); ?></p>
				</div>

				<div class="wcipc-section">
					<div class="wcipc-upload">
						<input type="file" class="wcipc-file" id="<?php echo esc_attr( $uid ); ?>-file" accept="image/jpeg,image/png,image/webp" />
						<label for="<?php echo esc_attr( $uid ); ?>-file" class="wcipc-btn wcipc-btn--primary"><span class="wcipc-upload-text"><?php esc_html_e( 'Upload photo', 'wc-islamabad-photo-card' ); ?></span></label>
					</div>
					<p class="wcipc-status" role="status" aria-live="polite"></p>
				</div>

				<div class="wcipc-section">
					<fieldset class="wcipc-roles">
						<legend><?php esc_html_e( 'Frame', 'wc-islamabad-photo-card' ); ?></legend>
						<?php foreach ( $roles_cfg as $i => $role ) : ?>
							<label class="wcipc-role" style="--wcipc-role:<?php echo esc_attr( $role['color'] ); ?>;">
								<input type="radio" name="<?php echo esc_attr( $uid ); ?>-role" value="<?php echo esc_attr( $role['slug'] ); ?>" <?php checked( 0, $i ); ?> />
								<span class="wcipc-role__box">
									<span class="wcipc-role__label"><?php echo esc_html( $role['label'] ); ?></span>
									<span class="wcipc-role__ribbon"><?php echo esc_html( $role['ribbon'] ); ?></span>
								</span>
							</label>
						<?php endforeach; ?>
					</fieldset>

					<?php if ( $show_name ) : ?>
						<div class="wcipc-field wcipc-field--name">
							<div class="wcipc-field__row">
								<label for="<?php echo esc_attr( $uid ); ?>-name"><?php esc_html_e( 'Name on card (optional)', 'wc-islamabad-photo-card' ); ?></label>
							</div>
							<input type="text" id="<?php echo esc_attr( $uid ); ?>-name" class="wcipc-name" maxlength="40" autocomplete="name" />
						</div>
					<?php endif; ?>
				</div>

				<div class="wcipc-section">
					<div class="wcipc-field">
						<div class="wcipc-field__row">
							<label for="<?php echo esc_attr( $uid ); ?>-zoom"><?php esc_html_e( 'Zoom', 'wc-islamabad-photo-card' ); ?></label>
							<output class="wcipc-val wcipc-zoom-val" for="<?php echo esc_attr( $uid ); ?>-zoom">100%</output>
						</div>
						<input type="range" id="<?php echo esc_attr( $uid ); ?>-zoom" class="wcipc-zoom" min="0.2" max="4" step="0.01" value="1" disabled />
					</div>
					<div class="wcipc-field">
						<div class="wcipc-field__row">
							<label for="<?php echo esc_attr( $uid ); ?>-rotate"><?php esc_html_e( 'Rotate', 'wc-islamabad-photo-card' ); ?></label>
							<output class="wcipc-val wcipc-rot-val" for="<?php echo esc_attr( $uid ); ?>-rotate">0°</output>
						</div>
						<input type="range" id="<?php echo esc_attr( $uid ); ?>-rotate" class="wcipc-rotate" min="-180" max="180" step="1" value="0" disabled />
					</div>
					<div class="wcipc-tools">
						<label class="wcipc-switch">
							<input type="checkbox" class="wcipc-autofit" <?php checked( ! empty( $opts['auto_fit'] ) ); ?> disabled />
							<span class="wcipc-switch__text">
								<span class="wcipc-switch__label"><?php esc_html_e( 'Auto fit', 'wc-islamabad-photo-card' ); ?></span>
								<span class="wcipc-switch__hint"><?php esc_html_e( 'Show the whole photo, no cropping', 'wc-islamabad-photo-card' ); ?></span>
							</span>
						</label>
						<button type="button" class="wcipc-btn wcipc-btn--quiet wcipc-fit" disabled><?php esc_html_e( 'Reset position', 'wc-islamabad-photo-card' ); ?></button>
					</div>
				</div>

				<div class="wcipc-actions">
					<button type="button" class="wcipc-btn wcipc-btn--primary wcipc-save" disabled><?php esc_html_e( 'Save photo card', 'wc-islamabad-photo-card' ); ?></button>
					<button type="button" class="wcipc-btn wcipc-btn--accent wcipc-share" disabled><?php esc_html_e( 'Share card', 'wc-islamabad-photo-card' ); ?></button>
				</div>
			</div>
		</div>
		<?php
		return (string) ob_get_clean();
	}
}
