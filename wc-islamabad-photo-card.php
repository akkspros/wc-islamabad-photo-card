<?php
/**
 * Plugin Name:       WordCamp Islamabad Photo Card Maker
 * Plugin URI:        https://github.com/akkspros/wc-islamabad-photo-card
 * Description:       Lets attendees, speakers, volunteers, organizers, sponsors and table leads create and share a branded WordCamp Islamabad 2026 photo card. Photos are processed in the browser and are never uploaded to your server.
 * Version:           1.6.4
 * Requires at least: 6.3
 * Requires PHP:      7.4
 * Author:            Arslan Kalwar
 * Author URI:        https://arslankalwar.com/
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       wc-islamabad-photo-card
 * Domain Path:       /languages
 *
 * @package WCIPC
 */

defined( 'ABSPATH' ) || exit;

define( 'WCIPC_VERSION', '1.6.4' );
define( 'WCIPC_FILE', __FILE__ );
define( 'WCIPC_PATH', plugin_dir_path( __FILE__ ) );
define( 'WCIPC_URL', plugin_dir_url( __FILE__ ) );
define( 'WCIPC_OPTION', 'wcipc_settings' );

require_once WCIPC_PATH . 'includes/class-wcipc-settings.php';
require_once WCIPC_PATH . 'includes/class-wcipc-frontend.php';
require_once WCIPC_PATH . 'includes/class-wcipc-plugin.php';

register_activation_hook( __FILE__, array( 'WCIPC_Plugin', 'activate' ) );

add_action( 'plugins_loaded', array( 'WCIPC_Plugin', 'instance' ) );
