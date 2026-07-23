# Development

## Setup

```sh
git clone https://github.com/smithplus/clipdrop.git
cd clipdrop
npm test
```

Root tests use Node.js's built-in test runner. Desktop packaging dependencies
live under `companion/` and are not needed to test the core modules.

## Commands

```sh
npm test
npm run test:helper
npm run test:plugin
npm run test:packaging
npm run start:helper
npm run package:plugin
npm install --prefix companion
npm run build:mac
```

## Structure

- `plugin/`: UXP panel and preview.
- `helper/`: local API and media processing.
- `companion/`: menu bar app, bundled-tool preparation, and desktop installer.
- `scripts/`: packaging.
- `dist/`: `.ccx` package.
- `docs/`: architecture, installation, and design decisions.

## Recommended Cycle

1. Add a test that describes the behavior.
2. Confirm it fails because the behavior is absent.
3. Implement the smallest change.
4. Run the complete suite.
5. Rebuild the `.ccx` or the full macOS installer.
6. Install and test it in Premiere.

## Load with UDT

1. Enable developer mode in Premiere's plugin preferences.
2. Restart Premiere.
3. Add `plugin/manifest.json` in UXP Developer Tool.
4. Use `Load & Watch`.

## GitHub Actions

`.github/workflows/validate.yml` runs tests, builds the `.ccx`, and uploads it as
a workflow artifact. The macOS installer is currently built and validated on
Apple Silicon because it contains architecture-specific media binaries.
