# WordCamp Islamabad Photo Card Maker: Documentation

Version 1.6.4 · Author: [Arslan Kalwar](https://arslankalwar.com/) · Requires WordPress 6.3+ · Requires PHP 7.4+ · License GPL-2.0-or-later

This guide covers installation, configuration, customization, security and privacy design, accessibility, development and release.

---

## 1. What the plugin does

Visitors open your photo card page and:

1. Upload a JPG, PNG or WebP photo.
2. Choose a frame: Attending, Speaking, Leading a Table, Volunteering, Organizing, Sponsoring, Supporting or Ambassador.
3. Drag or pinch the card to position the photo, and optionally zoom, rotate and add their name.
4. Save a 1080 × 1080 PNG, or share it through the native share sheet.

All image work happens in the visitor's browser using an HTML `<canvas>`. No photo is uploaded to your server, so there is no storage, moderation or GDPR upload burden.

The built-in frame is illustrated in code and in two bundled SVG files, so it needs no photos. It combines:

* a mint-white sky with soft green mist and birds;
* layered misty green Margalla Hills with a faint Islamabad skyline;
* the **Pakistan Monument** and **Faisal Mosque** (`assets/images/landmark-*.svg`), recoloured in greens at draw time;
* a forest line of tree crowns in the primary and dark colors;
* a round photo window with a ring and a notched ribbon in the **role's own color** (for example red for Organizing, gold for Speaking);
* an optional name line;
* a mint-white title plate with your **event logo badge**, "WORDCAMP" and "Islamabad 2026";
* the date, venue and hashtag.

You can replace the frame for any role with your own transparent PNG or WebP.

---

## 2. Installation

### From a ZIP

1. Go to **Plugins → Add New → Upload Plugin**.
2. Choose `wc-islamabad-photo-card.zip` and click **Install Now**.
3. Click **Activate**.

### Manually (FTP or SFTP)

1. Unzip and upload the `wc-islamabad-photo-card` folder to `wp-content/plugins/`.
2. Activate it on the **Plugins** screen.

### Create the page

1. Create a page, for example titled "Photo card" with the slug `photo-card`.
2. Add the shortcode `[wcisb_photo_card]`, or insert the **WordCamp Photo Card** block.
3. Publish. Done. The scripts and styles load only on pages that contain the card maker.

> Tip: if you use WordCamp.org's own platform you cannot install custom plugins there. This plugin is for self-hosted WordPress sites such as a campaign or community microsite. For WordCamp.org-hosted sites, ask the WordPress Community Team about adding the functionality as a mu-plugin or page template.

---

## 3. Settings

Open **Settings → WordCamp Photo Card**. Only users with the `manage_options` capability can see this page.

| Setting | Default | Purpose |
|---|---|---|
| Title, line 1 | `WordCamp` | Small spaced text at the top of the card. |
| Title, line 2 | `Islamabad 2026` | Large title on the card. |
| Date line | `24–25 October 2026` | Printed at the bottom. |
| Venue line | `Allama Iqbal Open University, Islamabad` | Printed after the date. |
| Hashtag | `#WCISB2026` | Printed on the card and used in the share message. A leading `#` is added automatically. |
| Share message | `{ribbon} at WordCamp Islamabad 2026! {hashtag}` plus the link on a new line | Text sent with the shared image. |
| Link in message | `https://islamabad.wordcamp.org/2026/` | Replaces `{url}`. |
| Logo | none | Square logo for the card badge and the card maker header. See section 3.1. |
| Primary color | `#0f7a4a` | Hills, forest, title text and plate border. |
| Dark color | `#06241e` | Forest ground, text and the card maker background. |
| Accent color | `#26d465` | Card maker buttons, focus rings and the top edge. |
| Roles | all enabled | Which frames visitors can pick. At least one must stay enabled. |
| Custom frame | none | Optional transparent PNG or WebP per role. |
| Name field | on | Lets visitors print a name on the built-in frame. |
| Largest photo | 10 MB | Checked in the browser (1–25 MB). |

**Role colors:** every role has its own ring and ribbon color. Text on the ribbon switches automatically between white and dark for readable contrast. Change them with the `wcipc_roles` filter (see section 7).

**Colors:** the defaults follow the green palette of the WordCamp Islamabad 2026 website (dark `#06241e`, bright green `#26d465`). They are not an official palette. Set the three colors to your branding guidelines.

### 3.1 Adding the event logo

Two ways, in order of priority:

1. **Media Library (recommended).** Upload the logo to **Media → Add New**. Then open **Settings → WordCamp Photo Card → Event logo → Select logo** and save.
2. **Bundled file.** Copy a square `logo.png` into `wp-content/plugins/wc-islamabad-photo-card/assets/images/`. It is used when no Media Library logo is chosen. Plugin updates may overwrite this folder, so prefer option 1 for a site you maintain.

Requirements: square, PNG with a transparent or white background, at least 400 × 400 px. The logo is shown inside a white circle with a mint ring and is scaled to fit, never cropped.

The logo must be served from your own domain. Browsers refuse to export a card if it used an image from another site that does not send CORS headers, so hot-linking the logo from `islamabad.wordcamp.org` will not work (the card falls back to a drawn "WC" monogram). Download the logo and upload it to your Media Library instead.

If no logo is set, the card shows a green "WC / ISL" monogram badge.

### Share message placeholders

| Placeholder | Example output |
|---|---|
| `{ribbon}` | I'm Speaking |
| `{role}` | Speaking |
| `{hashtag}` | #WCISB2026 |
| `{url}` | https://islamabad.wordcamp.org/2026/ |

---

## 4. Shortcode

```
[wcisb_photo_card]
[wcisb_photo_card title="Show you're coming" roles="attending,speaking" show_name="no"]
```

| Attribute | Values | Description |
|---|---|---|
| `title` | text | Heading above the controls. Default "Make your photo card". |
| `roles` | comma-separated slugs | Limit to these roles. Must also be enabled in settings. Empty means all enabled roles. |
| `show_name` | `yes` / `no` | Overrides the name field setting. |

**Role slugs:** `attending`, `speaking`, `table-lead`, `volunteering`, `organizing`, `sponsoring`, `supporting`, `ambassador`.

If you place the shortcode with roles that are not enabled, logged-in editors see a short notice and everyone else sees nothing.

---

## 5. Block

Search for **WordCamp Photo Card** in the inserter (Widgets category). The sidebar offers a heading, a name field toggle, and role checkboxes. The block is server-side rendered, so the editor shows a placeholder and the card maker appears on the front end. Wide and full alignment are supported.

---

## 6. Custom frames

A custom frame replaces the built-in design for one role.

**Specification**

| Item | Requirement |
|---|---|
| Format | PNG or WebP with transparency |
| Size | Square, 1080 × 1080 px recommended |
| Photo window | Leave transparent. The visitor's photo fills the whole canvas behind your frame, scaled to cover. |
| Text | Put all text (role, dates) in the frame. Typed names are only drawn on the built-in frame. |
| Location | Upload to this site's Media Library (same origin). |

**How to add:** Settings → Roles and frames → **Select frame** for the role → choose the image → **Save Changes**.

**Why a frame may not load:** browsers refuse to export a canvas that included an image from a different origin unless the server sends CORS headers. If your media is served from a CDN or another domain, add `Access-Control-Allow-Origin: *` for image files. When a frame fails to load, the plugin shows a message and falls back to the built-in frame, so the visitor can still save a card.

---

## 7. Developer reference

### Filters

```php
// Add, remove or relabel roles.
add_filter( 'wcipc_roles', function ( $roles ) {
	$roles['press'] = array(
		'label'  => __( 'Press', 'my-textdomain' ),
		'ribbon' => __( "I'm covering it", 'my-textdomain' ),
		'color'  => '#8a3ffc', // Optional hex. Defaults to the plugin green.
	);
	$roles['speaking']['color'] = '#c2185b'; // Recolor an existing role.
	unset( $roles['supporting'] );
	return $roles;
} );

// Change the export resolution (default 1080). Layout scales automatically.
add_filter( 'wcipc_card_size', function () {
	return 2160;
} );
```

New roles appear in the settings screen, shortcode, block and card maker without further code. They use the built-in frame until a custom frame is set.

### Option storage

A single option, `wcipc_settings` (array), holds all settings. It is deleted on uninstall, including on each site of a multisite network.

### CSS customization

All styles are scoped under `.wcipc-app`. The three brand colors are CSS custom properties set inline on the wrapper: `--wcipc-primary`, `--wcipc-dark`, `--wcipc-accent`. Override others in your theme:

```css
.wcipc-app {
	--wcipc-line: #b7c9bf;
	max-width: 960px;
}
```

### File map

```
wc-islamabad-photo-card/
├── wc-islamabad-photo-card.php   Plugin header, constants, bootstrap
├── uninstall.php                 Removes the option (multisite aware)
├── readme.txt                    WordPress.org readme
├── includes/
│   ├── class-wcipc-plugin.php    Loader, textdomain, activation
│   ├── class-wcipc-settings.php  Roles, defaults, sanitization, admin page
│   └── class-wcipc-frontend.php  Shortcode, block render, markup, config
├── blocks/photo-card/
│   ├── block.json                Block metadata (API v3)
│   └── index.js                  Editor UI (no build step)
├── assets/
│   ├── images/                   Optional logo.png (see 3.1)
│   ├── js/photo-card.js          Canvas editor
│   ├── js/admin.js               Media picker for frames
│   ├── css/photo-card.css        Front-end styles
│   └── css/admin.css             Settings screen styles
├── languages/                    Translation files
└── docs/DOCUMENTATION.md         This file

Repository root (not shipped to WordPress.org): README.md, CHANGELOG.md, CONTRIBUTING.md,
CODE_OF_CONDUCT.md, SECURITY.md, LICENSE, .distignore, .github/
```

There is no build step: no npm, no bundler. The files in the repository are the files that ship.

### Changing the built-in design

The frame is drawn in `drawDefaultFrame()` in `assets/js/photo-card.js`, using a 1080 × 1080 design space. Key functions: `drawLandmarksScene()` (sky, hills, landmarks, forest, ground), `greenLandmark()` (recolours the SVG landmarks), `drawMosque()`, `drawRibbon()`, `drawTitlePlate()`, `drawLogoBadge()` and `photoBox()` (position and size of the photo circle). Edit the numbers and reload.

---

## 8. Compliance with WordPress plugin guidelines

| Guideline or standard | How the plugin meets it |
|---|---|
| GPL-compatible license | GPL-2.0-or-later; no bundled third-party code or assets. |
| Unique prefixes | `WCIPC_` classes, `wcipc_` options, hooks, handles; `.wcipc-` CSS classes. |
| Direct access protection | Every PHP file begins with `defined( 'ABSPATH' ) \|\| exit;`. |
| Sanitize input | Settings pass through a single `sanitize_callback`: `sanitize_text_field`, `sanitize_textarea_field`, `sanitize_hex_color`, `esc_url_raw`, `sanitize_key`, `absint`, whitelist checks for roles and attachment MIME types. |
| Escape output | `esc_html`, `esc_attr`, `esc_url`, `esc_textarea`, `wp_json_encode` inside `esc_attr`. |
| Capabilities and nonces | Settings page requires `manage_options`; saving uses the Settings API (`settings_fields()` nonce and capability check in `options.php`). The plugin has no custom AJAX or REST endpoints. |
| Enqueue properly | `wp_register_*` and `wp_enqueue_*` only; front-end assets load only when the card renders; admin assets only on the plugin's settings screen; script uses the `defer` strategy and loads in the footer. |
| Versioned assets | All assets use `WCIPC_VERSION` for cache busting. |
| Internationalization | Text domain matches the slug `wc-islamabad-photo-card`; translator comments; `wp_set_script_translations()` for the block. |
| No external requests or tracking | No CDNs, fonts, analytics, phoning home or upsells. System font stack only. |
| Privacy | No personal data is collected or stored. Documented in `readme.txt`. |
| Uninstall cleanup | `uninstall.php` deletes the option on all sites. |
| Activation | Adds default options only if none exist; does not overwrite. |
| Block standards | `block.json` with API version 3, `register_block_type()` from metadata, dynamic render callback. |
| Accessibility | See section 9. |
| No admin nags, no hijacked dashboard | Only a Settings link on the Plugins screen. |
| Trademarks | The built-in frame uses text and shapes, not the WordPress or WordCamp logos. |

### Trademark note

"WordCamp" and "WordPress" are trademarks of the WordPress Foundation. WordCamp organizing teams may use them for the official event. If you plan to publish this plugin in the public WordPress.org directory under a different owner, check the Foundation's trademark policy and the directory's guidelines on plugin names and slugs first. Change the `Author`, `Contributors` and `Plugin URI` fields to your own team before distributing.

---

## 9. Accessibility

The plugin targets WCAG 2.2 AA.

* Every control has a visible label; the file input is visually hidden but keyboard-focusable and its label shows a focus ring.
* The role picker is a real `radio` group inside a `fieldset` with a `legend`.
* The canvas is focusable with an accessible name that explains the keyboard controls. Arrow keys move the photo (Shift = larger steps), `+` / `-` zoom, `[` / `]` rotate.
* Status and error messages use `role="status"` with `aria-live="polite"`.
* Touch targets are at least 40–48 px.
* Visible `:focus-visible` outlines on all interactive elements.
* Animations are limited to short transitions and are disabled under `prefers-reduced-motion`.
* Stronger borders under `prefers-contrast: more`.
* Layout uses logical properties, so it works in right-to-left languages.
* The layout is responsive from 320 px upward.

Check your chosen brand colors for contrast. The default buttons use dark green text on bright green (about 8:1), the ribbon switches between white and dark text automatically, and white text on the dark green background is about 16:1.

---

## 10. Security and privacy design

* **Client-side only.** No upload endpoint exists, so there is no file-upload attack surface, no stored user media and no personal data processing.
* **Input validation.** The browser checks file type (JPEG, PNG, WebP) and size before decoding. Object URLs are revoked after use.
* **Settings.** Whitelisted and sanitized; custom frame IDs are verified to be image attachments of type PNG or WebP.
* **No inline scripts.** Configuration is passed in a JSON `data-config` attribute that is escaped with `esc_attr()`, which is compatible with strict Content Security Policies (no `unsafe-inline` for scripts is needed).
* **Output.** All dynamic values in HTML are escaped at the point of output.

---

## 11. Browser support

Works in current Chrome, Edge, Firefox, Safari (macOS and iOS) and Chrome for Android. Requires Pointer Events and Canvas 2D (all evergreen browsers).

* **Native sharing with a file** needs the Web Share API Level 2: supported on iOS Safari, Chrome for Android and some desktop browsers. Elsewhere, "Share card" downloads the image and copies the message to the clipboard.
* **Letter spacing** on canvas text (`ctx.letterSpacing`) is used where supported and ignored otherwise.
* **EXIF orientation** is handled by the browser's image decoder.

---

## 12. Translation

The text domain is `wc-islamabad-photo-card`. To generate a template:

```bash
wp i18n make-pot . languages/wc-islamabad-photo-card.pot --slug=wc-islamabad-photo-card
```

Translate with Poedit or Loco Translate, saving `wc-islamabad-photo-card-ur.po/.mo` (Urdu) in the `languages` folder. For block strings also run `wp i18n make-json languages --no-purge`.

The built-in frame text (title, dates, venue, hashtag) is edited in Settings, so it can be written in any language. Note that canvas text uses the visitor's system fonts; Urdu and Arabic script render correctly where the device has a suitable font.

---

## 13. Troubleshooting

| Problem | Cause and fix |
|---|---|
| The card maker does not appear | Check the shortcode spelling `[wcisb_photo_card]`; confirm the plugin is active; if roles are restricted, make sure they are enabled in settings. |
| Upload says "Please choose a JPG, PNG or WebP image" | HEIC photos from some phones are not supported by browsers. Choose "Most Compatible" in the camera settings, or take a screenshot or export as JPG. |
| Custom frame is ignored | Frame is on another origin without CORS headers, or the file is not PNG/WebP. Re-upload to the Media Library. |
| "Save" does nothing on an iPhone in an in-app browser | Some social apps block downloads. Open the page in Safari or Chrome. |
| Styles look different in my theme | All plugin rules are scoped under `.wcipc-app` and reset button, label, input and slider styling, including `text-transform`, colors and range thumbs. If a theme still wins (for example with `!important`), add a more specific rule under `.wcipc-app`. |
| Logo shows as "WC" monogram | No logo is set, or the logo is on another domain without CORS headers. Upload it to the Media Library. |
| Page is cached and settings changes do not appear | Purge your page cache and CDN after saving settings. Asset URLs carry the plugin version. |
| Rotate or zoom sliders are disabled | They activate after a photo is uploaded. |

---

## 14. Test checklist before the event

- [ ] Upload JPG, PNG and WebP photos; each works.
- [ ] A 20 MB photo shows the size message.
- [ ] A PDF or GIF shows the type message.
- [ ] Drag, pinch (on a real phone), wheel zoom and both sliders work.
- [ ] Each enabled role shows the correct ribbon.
- [ ] Name text shrinks to fit a long name and works with Urdu text.
- [ ] "Save photo card" downloads a 1080 × 1080 PNG.
- [ ] "Share card" works on iOS Safari and Android Chrome.
- [ ] Keyboard-only: tab through all controls, move the photo with arrow keys.
- [ ] Screen reader announces status messages.
- [ ] Custom frame (if used) loads and exports correctly.
- [ ] Page works with your caching plugin and CDN.
- [ ] Enable `WP_DEBUG` and confirm there are no PHP notices.
- [ ] Run PHPCS with the WordPress Coding Standards and the Plugin Check plugin.
- [ ] Update **Tested up to** in `readme.txt` to the WordPress version you actually tested.

### Recommended tooling

```bash
composer global require wp-coding-standards/wpcs dealerdirect/phpcodesniffer-composer-installer
phpcs --standard=WordPress .
```

And install the official **Plugin Check** plugin to scan for guideline issues.

---

## 15. FAQ

**Can visitors download a transparent card?** No. Cards are flattened PNGs.

**Can I add a QR code or sponsor logos?** Yes, with a custom frame that includes them, or by editing `drawDefaultFrame()`.

**Can I change the aspect ratio (for example 4:5 for Instagram)?** The design space is square. For a different ratio, change `D`, `photoBox()` and the canvas dimensions in `class-wcipc-frontend.php`. Using a custom frame at the new ratio is easier.

**Does it record who made a card?** No. There is no database table, log or analytics.

**Does the plugin work on multisite?** Yes. Settings are per site; uninstall cleans all sites.

---

## 16. Changelog

### 1.6.4
* Final release check: fixed a PHP warning when a custom role added with the wcipc_roles filter has no color; Plugin URI now points to the GitHub repository. Verified activation, defaults, upgrade migration, shortcode, block, settings sanitizing and output escaping.

### 1.6.3
* Frame buttons redesigned (dark cards, role-color dot, check mark on the selected one, hover lift). Ribbon text on the card is always white; light role colors such as gold are deepened for contrast.

### 1.6.2
* Card artwork polished: soft feathered clouds (30% opacity), hazy layered hills with mist, landmark shadows, natural tree line, gradient ribbon, soft ring shadow with a fine white outer ring.

### 1.6.1
* Card artwork redesigned after the WordCamp Islamabad 2026 poster: mint-white sky, misty green hills, green Pakistan Monument and Faisal Mosque, forest line, green title plate. No cream, gold or sun.
* Interface and default colors follow the website palette (dark `#06241e`, bright green `#26d465`, mint `#f0f6f0`). Sites still on the old defaults are updated automatically.

### 1.5.3
* Green theme for the card maker container (follows the primary/dark colors in Settings).

### 1.5.2
* Interface colors restored to the cream, green and white scheme.

### 1.5.1
* Card maker container is 1280 px wide; modernised panel (sections, switch for Auto fit, live zoom/rotate values); fixed hidden Auto fit label and Reset button under strong theme CSS.

### 1.5.0
* The Islamabad landmarks illustration is now the only background (no selector, no photo backgrounds). Landmarks zoomed out so both are fully visible.
* Default hashtag is now `#WCISB2026` (a saved `#WordCampIslamabad` is shown as the new default).
* Smaller "Islamabad 2026" title so it clears the date column.

### 1.4.1
* Redesigned title block (plate with gold border, bigger logo badge, date and venue inside the plate, name flourishes).

### 1.4.0
* New default background "Islamabad landmarks" with SVG illustrations of Faisal Mosque and the Pakistan Monument (`assets/images/landmark-*.svg`).

### 1.3.0
* Photo backgrounds (Pakistan Monument, Faisal Mosque) bundled in `assets/images/`, tinted to the brand colors. Visitors pick a background; Settings → Options sets the default. Replace the files or use the `wcipc_backgrounds` filter for other images.

### 1.2.0
* The real WordCamp Islamabad logo is bundled (`assets/images/logo.png`). It shows inside the circle before a photo is added and fills the title badge instead of the "WC" monogram. A logo chosen in Settings still takes priority.
* New **Auto fit** option: shows the whole photo without cropping, with a blurred backdrop. Default is set in Settings → Options; visitors can toggle it. Zoom range is now 0.2×–4×; "Fit photo" is now "Reset position".
* Author set to Arslan Kalwar (https://arslankalwar.com/).

### 1.1.0
* New illustrated default frame (Margalla Hills, Faisal Mosque, sun, birds, pattern).
* Event logo setting with Media Library picker and optional bundled `assets/images/logo.png`.
* Per-role ring and ribbon colors; automatic text contrast on the ribbon.
* Branded header on the card maker; "Change photo" label after upload.
* Theme-proof CSS: custom range sliders, forced button and label styles.

### 1.0.0
* Initial release.
