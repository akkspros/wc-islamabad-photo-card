# Contributing

Thank you for helping with the WordCamp Islamabad Photo Card Maker. Contributions of all sizes are welcome: bug reports, design polish, translations, accessibility fixes and documentation.

## Ways to contribute

- **Report a bug or suggest a feature:** open an [issue](../../issues/new/choose).
- **Fix or improve something:** fork the repo, create a branch, open a pull request.
- **Translate:** the text domain is `wc-islamabad-photo-card`. Use `languages/wc-islamabad-photo-card.pot` (Urdu is especially welcome).

## Development setup

There is no build step. Clone the repository into `wp-content/plugins/wc-islamabad-photo-card`, activate it and add `[wcisb_photo_card]` to a page. Edit the files and reload.

Requirements: WordPress 6.3+, PHP 7.4+.

## Standards

- **PHP:** [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/). Check with `phpcs --standard=WordPress .`
- **JavaScript and CSS:** WordPress [JS](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/javascript/) and [CSS](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/css/) standards. Tabs for indentation.
- **Prefix everything** with `wcipc` / `WCIPC_` / `.wcipc-`. Scope all CSS under `.wcipc-app`.
- **Security:** sanitize input, escape output, check capabilities. Do not add external requests, tracking or cookies.
- **Accessibility:** keep controls labelled and keyboard operable (WCAG 2.2 AA). Respect `prefers-reduced-motion`.
- **i18n:** wrap user-facing strings in translation functions with the text domain.
- **Compatibility:** no PHP syntax newer than 7.4.

## Pull requests

1. Keep each PR focused on one change.
2. Describe what changed and why; add a before/after screenshot for visual changes.
3. Run through the checklist in section 14 of [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md).
4. Update `CHANGELOG.md` and `readme.txt` for user-visible changes.

By contributing you agree your work is licensed under GPL-2.0-or-later.

## Code of conduct

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).
