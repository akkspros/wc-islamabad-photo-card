# Security Policy

## Supported versions

Only the latest release receives security fixes.

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Email **akkspros@gmail.com** with:

- a description of the issue and its impact,
- steps to reproduce (WordPress and PHP versions help),
- any proof of concept.

You will get a reply within a few days. Once a fix is released you are welcome to be credited.

## Design notes

The plugin has no upload endpoint, no custom AJAX or REST routes and stores no visitor data. Photos are processed in the browser only. See section 10 of [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md).
