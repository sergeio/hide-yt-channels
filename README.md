# Youtube: Hide Channels

Firefox extension (Manifest V3) that hides unwanted YouTube channels and videos.
Adds an unobtrusive "hide" button next to each channel name and video. Hidden
videos are fully removed from the page.

## How to develop

Requires Node.js. All commands use `npx`, so no global install is needed
(`npx` will fetch `web-ext` on first run).

Run the extension in a fresh Firefox profile:

```sh
npx web-ext run
```

Lint before submitting to [addons.mozilla.org](https://addons.mozilla.org) —
this must pass:

```sh
npx web-ext lint
```

Package the extension for AMO upload:

```sh
npx web-ext build
```

This creates a `.zip` in `./web-ext-artifacts/` that you upload to AMO.

To load temporarily for manual testing instead, open `about:debugging`,
click "This Firefox", then "Load Temporary Add-on...", and pick
`manifest.json`.

`AGENTS.md` records the project's design decisions for AI coding agents.
