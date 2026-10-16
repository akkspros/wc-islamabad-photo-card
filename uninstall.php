<?php
/**
 * Removes plugin data when the plugin is deleted from the Plugins screen.
 *
 * @package WCIPC
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

$wcipc_option = 'wcipc_settings';

if ( is_multisite() ) {
	$wcipc_sites = get_sites(
		array(
			'fields' => 'ids',
			'number' => 0,
		)
	);
	foreach ( $wcipc_sites as $wcipc_site_id ) {
		switch_to_blog( $wcipc_site_id );
		delete_option( $wcipc_option );
		restore_current_blog();
	}
} else {
	delete_option( $wcipc_option );
}
