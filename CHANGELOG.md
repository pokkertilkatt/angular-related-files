# Change Log

All notable changes to the "angular-related-files" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.3] - 2025-09-08

### Added
- New setting `angular-related-files.openInPreview` to control whether files are opened in a new tab or in preview mode.

### Changed
- Files are now opened in preview mode by default to reduce tab clutter. This can be disabled in the settings.

## [0.0.2] - 2025-07-24

### Changed
- Refactored file searching to use the more efficient `vscode.workspace.findFiles` API.
- Improved performance by leveraging native VS Code file searching capabilities.

## [0.0.1]

- Initial release
