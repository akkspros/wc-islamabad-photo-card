=== WordCamp Islamabad Photo Card Maker ===
Contributors: passoniate
Tags: wordcamp, photo card, badge, event, social sharing
Requires at least: 6.3
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.6.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Let attendees, speakers, volunteers, organizers, sponsors and table leads make and share a WordCamp Islamabad 2026 photo card. Photos never leave the visitor's device.

== Description ==

WordCamp Islamabad Photo Card Maker adds a photo card creator to your event website. A visitor uploads a photo, chooses their role, positions the photo by dragging or pinching, then saves or shares a square PNG card ready for social media.

**Features**

* Eight roles: Attending, Speaking, Leading a Table, Volunteering, Organizing, Sponsoring, Supporting and Ambassador.
* Built-in WordCamp Islamabad 2026 frame: a mint-white sky with misty green Margalla Hills, the Pakistan Monument and Faisal Mosque, a forest line, a colored role ribbon, your event logo badge, title plate, dates and venue.
* Event logo setting (Media Library) used on the card and in the header of the card maker.
* Optional custom frame per role: upload a transparent PNG or WebP in the settings.
* Drag, pinch, mouse-wheel zoom, zoom and rotate sliders, an Auto fit switch (whole photo, no cropping) and a "Reset position" button.
* Keyboard accessible: arrow keys move the photo, + and - zoom, [ and ] rotate.
* Save as PNG, or share with the native share sheet on supported phones (falls back to download and copies the share message).
* Optional name on the card.
* Shortcode and a server-side-rendered block.
* Brand colors, card text, hashtag and share message editable in Settings → WordCamp Photo Card.
* Translation ready, RTL friendly, no external requests, no tracking, no cookies.

**Usage**

Add the shortcode to any page:

`[wcisb_photo_card]`

Or insert the "WordCamp Photo Card" block. Optional shortcode attributes: `title`, `roles` (comma-separated slugs, e.g. `attending,speaking`), `show_name` (`yes` or `no`).

== Installation ==

1. Upload the `wc-islamabad-photo-card` folder to `/wp-content/plugins/`, or install the ZIP from Plugins → Add New → Upload Plugin.
2. Activate the plugin.
3. Go to Settings → WordCamp Photo Card to review the text and colors.
4. Add the `[wcisb_photo_card]` shortcode or the block to a page, for example `/photo-card`.

== Frequently Asked Questions ==

= Are visitors' photos uploaded to my server? =

No. The photo is read by the visitor's browser and drawn onto an HTML canvas. Nothing is sent to your site or to any third party.

= What size should a custom frame be? =

A square transparent PNG or WebP, ideally 1080 × 1080 px. The visitor's photo is placed behind it, so leave the photo window transparent.

= Why does my custom frame fall back to the standard frame? =

Browsers refuse to export a canvas that used an image from another origin without CORS headers. Upload the frame to the Media Library on the same site, or make sure your CDN sends `Access-Control-Allow-Origin`.

= Can I add more roles? =

Yes. Use the `wcipc_roles` filter. See the documentation in the plugin's `docs` folder.

= Does it work with page caching? =

Yes. The page output is the same for every visitor and no cookies are set.

= Does it use the WordPress or WordCamp logo? =

No. The built-in frame uses text and shapes only. Use the custom frame option if the organizing team wants official artwork.

== Privacy ==

This plugin does not collect, store or transmit personal data. Photos and names typed into the card maker stay in the visitor's browser and are discarded when the page is closed. The plugin sets no cookies and makes no external requests. If a visitor uses their device's share feature, the image and message are handled by the app they choose.

== Screenshots ==

1. A finished WordCamp Islamabad 2026 photo card with the "I'm Supporting" ribbon.
2. The card maker: live preview, frame buttons, zoom, rotate and Auto fit.

== Changelog ==

= 1.6.4 =
* Final release check: fixed a PHP warning when a custom role added with the wcipc_roles filter has no color; Plugin URI now points to the GitHub repository. Verified activation, defaults, upgrade migration, shortcode, block, settings sanitizing and output escaping.

= 1.6.3 =
* Frame buttons redesigned (dark cards, role-color dot, check mark on the selected one, hover lift). Ribbon text on the card is always white; light role colors such as gold are deepened for contrast.

= 1.6.2 =
* Card artwork polished: soft feathered clouds (30% opacity), hazy layered hills with mist, landmark shadows, natural tree line, gradient ribbon, soft ring shadow with a fine white outer ring.

= 1.6.1 =
* Interface background is now #F0FBF4; role chips use white text on dark green.
* Redesigned title plate at the bottom of the card (green date and venue panel).
* Soft clouds at 30% opacity in the card sky.

= 1.6.0 =
* Card artwork now follows the WordCamp Islamabad 2026 poster: mint-white sky, misty green Margalla hills, green Pakistan Monument and Faisal Mosque, forest line, green title plate.
* Plugin colours follow the website palette (dark #06241e, bright green #26d465).

= 1.5.3 =
* Green theme: the card maker now sits on the event's deep green with a gold top edge and a white control panel.

= 1.5.2 =
* Restored the cream background, green top border, white panel and green and cream controls. Kept the 1280 px width, Auto fit switch and live values.

= 1.5.1 =
* The card maker is now up to 1280 px wide.
* Fixed: the Auto fit label and the Reset position button could be hidden by theme styles.
* Cleaner, more modern interface: flat layout with sections, Auto fit as a switch, live zoom and rotation values. The card artwork is unchanged.

= 1.5.0 =
* The illustrated Islamabad landmarks scene is now the only background; the selector and photo backgrounds were removed.
* Landmarks zoomed out so Faisal Mosque and the Pakistan Monument are fully visible.
* Smaller "Islamabad 2026" title so it no longer runs into the date column.
* Default hashtag is now #WCISB2026.

= 1.4.1 =
* Redesigned the title block: larger logo badge, gold-bordered plate, and the date and venue now sit inside the plate. Gold flourishes frame the name.

= 1.4.0 =
* New default background "Islamabad landmarks": detailed illustrations of Faisal Mosque and the Pakistan Monument (SVG) on a warm sky with Margalla ridges, pines and tea-leaf fronds. The photo backgrounds and classic hills remain available.

= 1.3.0 =
* New photo backgrounds: Pakistan Monument and Faisal Mosque, tinted to the brand colors. Visitors can switch between them and the illustrated hills; the default is set in settings.

= 1.2.0 =
* The real WordCamp Islamabad logo is now built in: shown inside the circle before a photo is added and in the title badge.
* New Auto fit option shows the whole photo without cropping (blurred backdrop fills the gaps). Can be on by default in settings.
* Zoom goes down to 0.2x. "Fit photo" is now "Reset position".
* Author updated to Arslan Kalwar.

= 1.1.0 =
* New illustrated default frame: Margalla Hills, Faisal Mosque, sun, birds and pattern.
* New event logo setting, shown on the card and in a branded header.
* Each role now has its own ribbon and ring color.
* "Upload photo" changes to "Change photo" after a photo is added.
* Stronger CSS isolation so themes cannot restyle buttons, labels and sliders.

= 1.0.0 =
* Initial release.

== Upgrade Notice ==

= 1.6.4 =
Recommended. Fixes an empty plugin file in the 1.6.3 package and a PHP warning for custom roles.

= 1.6.3 =
Better frame buttons and white ribbon text.

= 1.6.2 =
More polished, higher-quality card artwork.

= 1.6.1 =
Light interface background, white role chip text, new title plate and clouds on the card.

= 1.6.0 =
New green card artwork and website-green interface colors.

= 1.5.3 =
Green theme for the card maker interface.

= 1.5.2 =
Brand colors restored in the card maker interface.

= 1.5.1 =
Wider, cleaner card maker interface and a fix for the hidden Auto fit controls.

= 1.5.0 =
Single landmarks background, new #WCISB2026 hashtag, layout polish.

= 1.4.1 =
Polished title block at the bottom of the card.

= 1.4.0 =
New illustrated Faisal Mosque and Pakistan Monument background, now the default.

= 1.3.0 =
Adds Pakistan Monument and Faisal Mosque photo backgrounds.

= 1.2.0 =
Adds the real event logo to the card and an Auto fit option for photos.

= 1.1.0 =
Adds the logo setting and a new default frame design. Review Settings → WordCamp Photo Card after updating.

= 1.0.0 =
Initial release.
