# Development

## Setup

```sh
git clone https://github.com/smithplus/clipdrop.git
cd clipdrop
npm test
```

The project has no npm runtime dependencies. Tests use Node.js's built-in test
runner.

## Commands

```sh
npm test
npm run test:helper
npm run test:plugin
npm run test:packaging
npm run start:helper
npm run package:plugin
```

## Structure

- `plugin/`: UXP panel and preview.
- `helper/`: local API and media processing.
- `scripts/`: packaging.
- `dist/`: `.ccx` package.
- `docs/`: architecture, installation, and design decisions.

## Recommended Cycle

1. Add a test that describes the behavior.
2. Confirm it fails because the behavior is absent.
3. Implement the smallest change.
4. Run the complete suite.
5. Rebuild the `.ccx`.
6. Install and test it in Premiere.

## Load with UDT

1. Enable developer mode in Premiere's plugin preferences.
2. Restart Premiere.
3. Add `plugin/manifest.json` in UXP Developer Tool.
4. Use `Load & Watch`.

## GitHub Actions

`.github/workflows/validate.yml` runs tests, builds the `.ccx`, and uploads it as
a workflow artifact. Self-contained cross-platform installers will be added in
a later phase.
