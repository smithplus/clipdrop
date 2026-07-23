# Official Adobe Premiere UXP Reference

ClipDrop was checked against Adobe's official documentation and samples on
July 23, 2026. This repository does not keep full copies of those sources,
avoiding duplication, repository weight, and stale documentation.

## Sources

- [Premiere UXP API](https://developer.adobe.com/premiere-pro/uxp/)
- [Your first UXP plugin](https://developer.adobe.com/premiere-pro/uxp/plugins/)
- [UXP manifest](https://developer.adobe.com/premiere-pro/uxp/plugins/concepts/manifest/)
- [UXP WebView](https://developer.adobe.com/premiere-pro/uxp/uxp-api/reference-js/global-members/html-elements/html-web-view-element)
- [Package a plugin](https://developer.adobe.com/premiere-pro/uxp/plugins/distribution/package/)
- [Install a plugin](https://developer.adobe.com/premiere-pro/uxp/plugins/distribution/install/)
- [Official samples](https://github.com/AdobeDocs/uxp-premiere-pro-samples)

## Applied Patterns

- Manifest v5 with the `premierepro` host.
- Domain-scoped network and WebView permissions.
- `Project.importFiles()` for importing output.
- `project.lockedAccess()` and transactions for bin creation.
- Local WebView with a message bridge for preview.

Review the manifest, permissions, and distribution guidance again before every
public release.
