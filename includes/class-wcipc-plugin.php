<?php
/**
 * Plugin bootstrap.
 *
 * @package WCIPC
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class WCIPC_Plugin
 */
final class WCIPC_Plugin {

	/**
	 * Single instance.
	 *
	 * @var WCIPC_Plugin|null
	 */
	private static $instance = null;

	/**
	 * Returns the single instance and wires everything up.
	 *
	 * @return WCIPC_Plugin
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		load_plugin_textdomain( 'wc-islamabad-photo-card', false, dirname( plugin_basename( WCIPC_FILE ) ) . '/languages' );

		( new WCIPC_Frontend() )->register();

		if ( is_admin() ) {
			( new WCIPC_Settings() )->register();
		}
	}

	/**
	 * Stores default options on first activation without overwriting existing ones.
	 */
	public static function activate() {
		if ( false === get_option( WCIPC_OPTION, false ) ) {
			add_option( WCIPC_OPTION, WCIPC_Settings::defaults() );
		}
	}
}
