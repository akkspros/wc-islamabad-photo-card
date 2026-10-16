<?php
/**
 * Settings: defaults, role definitions, sanitization and the admin screen.
 *
 * @package WCIPC
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class WCIPC_Settings
 */
class WCIPC_Settings {

	const PAGE_SLUG = 'wcipc-settings';
	const GROUP     = 'wcipc_settings_group';

	/**
	 * Hook into WordPress.
	 */
	public function register() {
		add_action( 'admin_menu', array( $this, 'add_menu' ) );
		add_action( 'admin_init', array( $this, 'register_setting' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( WCIPC_FILE ), array( $this, 'action_links' ) );
	}

	/**
	 * Every role a card can be made for. Keys are stable slugs.
	 *
	 * @return array<string, array{label:string, ribbon:string, color:string}>
	 */
	public static function all_roles() {
		$roles = array(
			'attending'    => array(
				'label'  => __( 'Attending', 'wc-islamabad-photo-card' ),
				'ribbon' => __( "I'm Attending", 'wc-islamabad-photo-card' ),
			),
			'speaking'     => array(
				'label'  => __( 'Speaking', 'wc-islamabad-photo-card' ),
				'ribbon' => __( "I'm Speaking", 'wc-islamabad-photo-card' ),
			),
			'table-lead'   => array(
				'label'  => __( 'Leading a Table', 'wc-islamabad-photo-card' ),
				'ribbon' => __( "I'm Leading a Table", 'wc-islamabad-photo-card' ),
			),
			'volunteering' => array(
				'label'  => __( 'Volunteering', 'wc-islamabad-photo-card' ),
				'ribbon' => __( "I'm Volunteering", 'wc-islamabad-photo-card' ),
			),
			'organizing'   => array(
				'label'  => __( 'Organizing', 'wc-islamabad-photo-card' ),
				'ribbon' => __( "I'm Organizing", 'wc-islamabad-photo-card' ),
			),
			'sponsoring'   => array(
				'label'  => __( 'Sponsoring', 'wc-islamabad-photo-card' ),
				'ribbon' => __( "I'm Sponsoring", 'wc-islamabad-photo-card' ),
			),
			'supporting'   => array(
				'label'  => __( 'Supporting', 'wc-islamabad-photo-card' ),
				'ribbon' => __( "I'm Supporting", 'wc-islamabad-photo-card' ),
			),
			'ambassador'   => array(
				'label'  => __( 'Ambassador', 'wc-islamabad-photo-card' ),
				'ribbon' => __( "I'm an Ambassador", 'wc-islamabad-photo-card' ),
			),
		);

		$colors = array(
			'attending'    => '#2bb673',
			'speaking'     => '#f4b942',
			'table-lead'   => '#1b8a8f',
			'volunteering' => '#2f6fd0',
			'organizing'   => '#d64045',
			'sponsoring'   => '#e8812a',
			'supporting'   => '#7a4fb5',
			'ambassador'   => '#0e5a8a',
		);
		foreach ( $roles as $slug => $role ) {
			if ( empty( $role['color'] ) || ! sanitize_hex_color( $role['color'] ) ) {
				$roles[ $slug ]['color'] = isset( $colors[ $slug ] ) ? $colors[ $slug ] : '#0f7a4a';
			}
		}

		/**
		 * Filters the available card roles.
		 *
		 * @param array $roles Role slug => array( label, ribbon, color ).
		 */
		return apply_filters( 'wcipc_roles', $roles );
	}

	/**
	 * Default option values.
	 *
	 * @return array
	 */
	public static function defaults() {
		return array(
			'title_line_1'  => 'WordCamp',
			'title_line_2'  => 'Islamabad 2026',
			'date_text'     => __( '24–25 October 2026', 'wc-islamabad-photo-card' ),
			'venue_text'    => __( 'Allama Iqbal Open University, Islamabad', 'wc-islamabad-photo-card' ),
			'hashtag'       => '#WCISB2026',
			'share_text'    => __( "{ribbon} at WordCamp Islamabad 2026! {hashtag}\n{url}", 'wc-islamabad-photo-card' ),
			'share_url'     => 'https://islamabad.wordcamp.org/2026/',
			'color_primary' => '#0f7a4a',
			'color_dark'    => '#06241e',
			'color_accent'  => '#26d465',
			'roles'         => array_keys( self::all_roles() ),
			'frames'        => array(),
			'logo'          => 0,
			'auto_fit'      => 0,
			'show_name'     => 1,
			'max_upload_mb' => 10,
		);
	}

	/**
	 * Current settings merged with defaults.
	 *
	 * @return array
	 */
	public static function get() {
		$saved = get_option( WCIPC_OPTION, array() );
		$saved = is_array( $saved ) ? $saved : array();
		$opts = wp_parse_args( $saved, self::defaults() );
		// The hashtag used to default to #WordCampIslamabad; show the new default unless it was customised.
		// Colours still on the old defaults follow the website's green palette.
		if ( '#07261b' === strtolower( (string) $opts['color_dark'] ) ) {
			$opts['color_dark'] = '#06241e';
		}
		if ( '#f4b942' === strtolower( (string) $opts['color_accent'] ) ) {
			$opts['color_accent'] = '#26d465';
		}
		if ( '#WordCampIslamabad' === $opts['hashtag'] ) {
			$opts['hashtag'] = '#WCISB2026';
		}
		return $opts;
	}

	/**
	 * Registers the option with the Settings API.
	 */
	public function register_setting() {
		register_setting(
			self::GROUP,
			WCIPC_OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( $this, 'sanitize' ),
				'default'           => self::defaults(),
				'show_in_rest'      => false,
			)
		);
	}

	/**
	 * Sanitizes the submitted settings.
	 *
	 * @param mixed $input Raw submitted value.
	 * @return array
	 */
	public function sanitize( $input ) {
		$defaults = self::defaults();
		$input    = is_array( $input ) ? $input : array();
		$out      = array();

		foreach ( array( 'title_line_1', 'title_line_2', 'date_text', 'venue_text' ) as $key ) {
			$value       = isset( $input[ $key ] ) ? sanitize_text_field( $input[ $key ] ) : '';
			$out[ $key ] = '' !== $value ? $value : $defaults[ $key ];
		}

		$hashtag         = isset( $input['hashtag'] ) ? sanitize_text_field( $input['hashtag'] ) : '';
		$hashtag         = preg_replace( '/\s+/', '', $hashtag );
		$hashtag         = '' !== $hashtag ? '#' . ltrim( $hashtag, '#' ) : '';
		$out['hashtag']  = $hashtag;

		$share_text        = isset( $input['share_text'] ) ? sanitize_textarea_field( $input['share_text'] ) : '';
		$out['share_text'] = '' !== $share_text ? $share_text : $defaults['share_text'];

		$share_url        = isset( $input['share_url'] ) ? esc_url_raw( $input['share_url'], array( 'http', 'https' ) ) : '';
		$out['share_url'] = '' !== $share_url ? $share_url : $defaults['share_url'];

		foreach ( array( 'color_primary', 'color_dark', 'color_accent' ) as $key ) {
			$color       = isset( $input[ $key ] ) ? sanitize_hex_color( $input[ $key ] ) : '';
			$out[ $key ] = $color ? $color : $defaults[ $key ];
		}

		$all_slugs    = array_keys( self::all_roles() );
		$requested    = isset( $input['roles'] ) && is_array( $input['roles'] ) ? array_map( 'sanitize_key', $input['roles'] ) : array();
		$out['roles'] = array_values( array_intersect( $all_slugs, $requested ) );
		if ( empty( $out['roles'] ) ) {
			$out['roles'] = $defaults['roles'];
			add_settings_error( WCIPC_OPTION, 'wcipc_no_roles', __( 'At least one role must be enabled. All roles were restored.', 'wc-islamabad-photo-card' ), 'warning' );
		}

		$out['frames'] = array();
		if ( isset( $input['frames'] ) && is_array( $input['frames'] ) ) {
			foreach ( $all_slugs as $slug ) {
				$id = isset( $input['frames'][ $slug ] ) ? absint( $input['frames'][ $slug ] ) : 0;
				if ( $id && self::is_valid_frame( $id ) ) {
					$out['frames'][ $slug ] = $id;
				}
			}
		}

		$logo        = isset( $input['logo'] ) ? absint( $input['logo'] ) : 0;
		$out['logo'] = ( $logo && wp_attachment_is_image( $logo ) ) ? $logo : 0;

		$out['auto_fit']  = empty( $input['auto_fit'] ) ? 0 : 1;

		$out['show_name'] = empty( $input['show_name'] ) ? 0 : 1;

		$max                  = isset( $input['max_upload_mb'] ) ? absint( $input['max_upload_mb'] ) : $defaults['max_upload_mb'];
		$out['max_upload_mb'] = min( 25, max( 1, $max ) );

		return $out;
	}

	/**
	 * Whether an attachment can be used as a custom frame (PNG or WebP image).
	 *
	 * @param int $id Attachment ID.
	 * @return bool
	 */
	public static function is_valid_frame( $id ) {
		if ( ! wp_attachment_is_image( $id ) ) {
			return false;
		}
		return in_array( get_post_mime_type( $id ), array( 'image/png', 'image/webp' ), true );
	}

	/**
	 * URL of the event logo: the Media Library choice, else assets/images/logo.png
	 * if the file exists, else an empty string (a drawn monogram is used).
	 *
	 * @param string $size Image size for Media Library logos.
	 * @return string
	 */
	public static function logo_url( $size = 'medium' ) {
		$opts = self::get();
		$id   = isset( $opts['logo'] ) ? (int) $opts['logo'] : 0;
		if ( $id && wp_attachment_is_image( $id ) ) {
			$url = wp_get_attachment_image_url( $id, $size );
			if ( $url ) {
				return $url;
			}
		}
		if ( file_exists( WCIPC_PATH . 'assets/images/logo.png' ) ) {
			return WCIPC_URL . 'assets/images/logo.png';
		}
		return '';
	}

	/**
	 * Adds the Settings screen.
	 */
	public function add_menu() {
		add_options_page(
			__( 'WordCamp Photo Card', 'wc-islamabad-photo-card' ),
			__( 'WordCamp Photo Card', 'wc-islamabad-photo-card' ),
			'manage_options',
			self::PAGE_SLUG,
			array( $this, 'render_page' )
		);
	}

	/**
	 * Adds a Settings link on the Plugins screen.
	 *
	 * @param array $links Existing links.
	 * @return array
	 */
	public function action_links( $links ) {
		$url = admin_url( 'options-general.php?page=' . self::PAGE_SLUG );
		array_unshift( $links, '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Settings', 'wc-islamabad-photo-card' ) . '</a>' );
		return $links;
	}

	/**
	 * Loads admin assets on our settings screen only.
	 *
	 * @param string $hook Current admin page hook.
	 */
	public function enqueue_admin_assets( $hook ) {
		if ( 'settings_page_' . self::PAGE_SLUG !== $hook ) {
			return;
		}
		wp_enqueue_media();
		wp_enqueue_style( 'wcipc-admin', WCIPC_URL . 'assets/css/admin.css', array(), WCIPC_VERSION );
		wp_enqueue_script( 'wcipc-admin', WCIPC_URL . 'assets/js/admin.js', array( 'jquery' ), WCIPC_VERSION, true );
		wp_localize_script(
			'wcipc-admin',
			'wcipcAdmin',
			array(
				'mediaTitle'  => __( 'Choose a frame (transparent PNG or WebP)', 'wc-islamabad-photo-card' ),
				'mediaButton' => __( 'Use this frame', 'wc-islamabad-photo-card' ),
			)
		);
	}

	/**
	 * Renders the settings screen.
	 */
	public function render_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$opts  = self::get();
		$roles = self::all_roles();
		$name  = WCIPC_OPTION;
		?>
		<div class="wrap wcipc-admin">
			<h1><?php esc_html_e( 'WordCamp Islamabad Photo Card Maker', 'wc-islamabad-photo-card' ); ?></h1>
			<?php settings_errors( WCIPC_OPTION ); ?>

			<div class="wcipc-admin__usage">
				<h2><?php esc_html_e( 'How to use', 'wc-islamabad-photo-card' ); ?></h2>
				<p>
					<?php esc_html_e( 'Add the card maker to any page with the shortcode below, or insert the “WordCamp Photo Card” block in the editor.', 'wc-islamabad-photo-card' ); ?>
				</p>
				<p><code>[wcisb_photo_card]</code></p>
				<p>
					<?php esc_html_e( 'Optional attributes:', 'wc-islamabad-photo-card' ); ?>
					<code>title="Make your card"</code>
					<code>roles="attending,speaking"</code>
					<code>show_name="no"</code>
				</p>
			</div>

			<form method="post" action="options.php">
				<?php settings_fields( self::GROUP ); ?>

				<h2><?php esc_html_e( 'Card text', 'wc-islamabad-photo-card' ); ?></h2>
				<table class="form-table" role="presentation">
					<?php
					$this->text_row( 'title_line_1', __( 'Title, line 1', 'wc-islamabad-photo-card' ), $opts, $name );
					$this->text_row( 'title_line_2', __( 'Title, line 2', 'wc-islamabad-photo-card' ), $opts, $name );
					$this->text_row( 'date_text', __( 'Date line', 'wc-islamabad-photo-card' ), $opts, $name );
					$this->text_row( 'venue_text', __( 'Venue line', 'wc-islamabad-photo-card' ), $opts, $name );
					$this->text_row( 'hashtag', __( 'Hashtag', 'wc-islamabad-photo-card' ), $opts, $name );
					?>
				</table>

				<h2><?php esc_html_e( 'Sharing', 'wc-islamabad-photo-card' ); ?></h2>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><label for="wcipc-share_text"><?php esc_html_e( 'Share message', 'wc-islamabad-photo-card' ); ?></label></th>
						<td>
							<textarea id="wcipc-share_text" name="<?php echo esc_attr( $name ); ?>[share_text]" rows="3" class="large-text"><?php echo esc_textarea( $opts['share_text'] ); ?></textarea>
							<p class="description"><?php esc_html_e( 'Placeholders: {ribbon} (e.g. “I’m Speaking”), {role}, {hashtag}, {url}.', 'wc-islamabad-photo-card' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="wcipc-share_url"><?php esc_html_e( 'Link in message', 'wc-islamabad-photo-card' ); ?></label></th>
						<td><input type="url" id="wcipc-share_url" name="<?php echo esc_attr( $name ); ?>[share_url]" value="<?php echo esc_attr( $opts['share_url'] ); ?>" class="regular-text" /></td>
					</tr>
				</table>

				<h2><?php esc_html_e( 'Event logo', 'wc-islamabad-photo-card' ); ?></h2>
				<p class="description"><?php esc_html_e( 'The WordCamp Islamabad logo is built in and is used until you pick another one. Shown inside the circle before a photo is added, on the card (in the badge next to the title) and in the header of the card maker. Use a square PNG with a transparent or white background, at least 400 × 400 px. Upload it to the Media Library so it loads from your own site.', 'wc-islamabad-photo-card' ); ?></p>
				<?php
				$logo_id  = (int) $opts['logo'];
				$logo_img = $logo_id ? wp_get_attachment_image_url( $logo_id, 'thumbnail' ) : '';
				?>
				<table class="form-table" role="presentation">
					<tr class="wcipc-frame-row">
						<th scope="row"><?php esc_html_e( 'Logo', 'wc-islamabad-photo-card' ); ?></th>
						<td>
							<span class="wcipc-frame-preview"><?php if ( $logo_img ) : ?><img src="<?php echo esc_url( $logo_img ); ?>" alt="" /><?php endif; ?></span>
							<input type="hidden" class="wcipc-frame-id" name="<?php echo esc_attr( $name ); ?>[logo]" value="<?php echo esc_attr( $logo_id ); ?>" />
							<button type="button" class="button wcipc-select-frame" data-library="image"><?php esc_html_e( 'Select logo', 'wc-islamabad-photo-card' ); ?></button>
							<button type="button" class="button-link button-link-delete wcipc-remove-frame" <?php echo $logo_id ? '' : 'hidden'; ?>><?php esc_html_e( 'Remove', 'wc-islamabad-photo-card' ); ?></button>
						</td>
					</tr>
				</table>

				<h2><?php esc_html_e( 'Brand colors', 'wc-islamabad-photo-card' ); ?></h2>
				<p class="description"><?php esc_html_e( 'Used by the built-in frame and the card maker interface. Defaults are green hills and a gold ribbon inspired by the Margalla Hills; change them to match the official event palette.', 'wc-islamabad-photo-card' ); ?></p>
				<table class="form-table" role="presentation">
					<?php
					$this->color_row( 'color_primary', __( 'Primary (hills, buttons)', 'wc-islamabad-photo-card' ), $opts, $name );
					$this->color_row( 'color_dark', __( 'Dark (background, text)', 'wc-islamabad-photo-card' ), $opts, $name );
					$this->color_row( 'color_accent', __( 'Accent (ribbon, ring)', 'wc-islamabad-photo-card' ), $opts, $name );
					?>
				</table>

				<h2><?php esc_html_e( 'Roles and frames', 'wc-islamabad-photo-card' ); ?></h2>
				<p class="description">
					<?php esc_html_e( 'Choose which roles appear. To replace the built-in frame for a role, select a square transparent PNG or WebP (recommended 1080 × 1080 px). The photo is placed behind your image, so leave the photo area transparent.', 'wc-islamabad-photo-card' ); ?>
				</p>
				<table class="widefat striped wcipc-frames">
					<thead>
						<tr>
							<th scope="col"><?php esc_html_e( 'Show', 'wc-islamabad-photo-card' ); ?></th>
							<th scope="col"><?php esc_html_e( 'Role', 'wc-islamabad-photo-card' ); ?></th>
							<th scope="col"><?php esc_html_e( 'Custom frame (optional)', 'wc-islamabad-photo-card' ); ?></th>
						</tr>
					</thead>
					<tbody>
					<?php
					foreach ( $roles as $slug => $role ) :
						$frame_id  = isset( $opts['frames'][ $slug ] ) ? (int) $opts['frames'][ $slug ] : 0;
						$frame_img = $frame_id ? wp_get_attachment_image_url( $frame_id, 'thumbnail' ) : '';
						?>
						<tr class="wcipc-frame-row">
							<td>
								<input type="checkbox" id="wcipc-role-<?php echo esc_attr( $slug ); ?>" name="<?php echo esc_attr( $name ); ?>[roles][]" value="<?php echo esc_attr( $slug ); ?>" <?php checked( in_array( $slug, $opts['roles'], true ) ); ?> />
							</td>
							<td><label for="wcipc-role-<?php echo esc_attr( $slug ); ?>"><?php echo esc_html( $role['label'] ); ?></label></td>
							<td>
								<span class="wcipc-frame-preview"><?php if ( $frame_img ) : ?><img src="<?php echo esc_url( $frame_img ); ?>" alt="" /><?php endif; ?></span>
								<input type="hidden" class="wcipc-frame-id" name="<?php echo esc_attr( $name ); ?>[frames][<?php echo esc_attr( $slug ); ?>]" value="<?php echo esc_attr( $frame_id ); ?>" />
								<button type="button" class="button wcipc-select-frame"><?php esc_html_e( 'Select frame', 'wc-islamabad-photo-card' ); ?></button>
								<button type="button" class="button-link button-link-delete wcipc-remove-frame" <?php echo $frame_id ? '' : 'hidden'; ?>><?php esc_html_e( 'Remove', 'wc-islamabad-photo-card' ); ?></button>
							</td>
						</tr>
					<?php endforeach; ?>
					</tbody>
				</table>

				<h2><?php esc_html_e( 'Options', 'wc-islamabad-photo-card' ); ?></h2>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><?php esc_html_e( 'Auto fit', 'wc-islamabad-photo-card' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="<?php echo esc_attr( $name ); ?>[auto_fit]" value="1" <?php checked( ! empty( $opts['auto_fit'] ) ); ?> />
								<?php esc_html_e( 'Turn Auto fit on by default (shows the whole photo instead of cropping it to fill the frame)', 'wc-islamabad-photo-card' ); ?>
							</label>
							<p class="description"><?php esc_html_e( 'Visitors can always switch it on or off themselves.', 'wc-islamabad-photo-card' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Name field', 'wc-islamabad-photo-card' ); ?></th>
						<td>
							<label>
								<input type="checkbox" name="<?php echo esc_attr( $name ); ?>[show_name]" value="1" <?php checked( ! empty( $opts['show_name'] ) ); ?> />
								<?php esc_html_e( 'Let people print their name on the built-in frame', 'wc-islamabad-photo-card' ); ?>
							</label>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="wcipc-max_upload_mb"><?php esc_html_e( 'Largest photo (MB)', 'wc-islamabad-photo-card' ); ?></label></th>
						<td>
							<input type="number" id="wcipc-max_upload_mb" name="<?php echo esc_attr( $name ); ?>[max_upload_mb]" value="<?php echo esc_attr( $opts['max_upload_mb'] ); ?>" min="1" max="25" class="small-text" />
							<p class="description"><?php esc_html_e( 'Checked in the visitor’s browser. Photos never reach your server.', 'wc-islamabad-photo-card' ); ?></p>
						</td>
					</tr>
				</table>

				<?php submit_button(); ?>
			</form>
		</div>
		<?php
	}

	/**
	 * Prints a text input row.
	 *
	 * @param string $key   Option key.
	 * @param string $label Label.
	 * @param array  $opts  Current options.
	 * @param string $name  Option name.
	 */
	private function text_row( $key, $label, $opts, $name ) {
		?>
		<tr>
			<th scope="row"><label for="wcipc-<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $label ); ?></label></th>
			<td><input type="text" id="wcipc-<?php echo esc_attr( $key ); ?>" name="<?php echo esc_attr( $name ); ?>[<?php echo esc_attr( $key ); ?>]" value="<?php echo esc_attr( $opts[ $key ] ); ?>" class="regular-text" /></td>
		</tr>
		<?php
	}

	/**
	 * Prints a color input row.
	 *
	 * @param string $key   Option key.
	 * @param string $label Label.
	 * @param array  $opts  Current options.
	 * @param string $name  Option name.
	 */
	private function color_row( $key, $label, $opts, $name ) {
		?>
		<tr>
			<th scope="row"><label for="wcipc-<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $label ); ?></label></th>
			<td><input type="color" id="wcipc-<?php echo esc_attr( $key ); ?>" name="<?php echo esc_attr( $name ); ?>[<?php echo esc_attr( $key ); ?>]" value="<?php echo esc_attr( $opts[ $key ] ); ?>" /></td>
		</tr>
		<?php
	}
}
