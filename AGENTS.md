# AGENTS.md

## Project
Firefox WebExtension (Manifest V3) for addons.mozilla.org: hide unwanted
YouTube channels and videos. Adds an unobtrusive "hide" button next to each
channel name and video.

## Status
- Repo starts empty; this file records the agreed design. Verify claims
  against code once it exists.

## Architecture (decided)
- Plain modern JS, CSS, and manifest.json. No build step, bundler, or TypeScript.
- Content script runs on www.youtube.com.
- YouTube is a SPA with infinite scroll: use a MutationObserver to keep
  applying hides as new content renders. One-time DOM scans are insufficient.
- Hidden videos: fully remove the element from the DOM (not collapse/dim).
- Storage: browser.storage.local, NOT localStorage (isolated from YouTube's
  origin data, survives "clear site data", shared across extension contexts).
  - Key "channels": array of channel identifiers — href-based ids (`UC...`,
    `@handle`) when a channel link exists, and/or the display name. Items are
    matched by either form, and hiding a channel stores both, so watch-page
    sidebar lockups (which have no channel link) filter by name too.
  - Key "videos": array of video ids (from `watch?v=` / Shorts links).
  - Key "words": array of banned words (lowercase); videos whose title
    contains any of them as a case-insensitive substring are hidden.

## Workflow
- Dev: `npx web-ext run` (loads extension in a clean Firefox profile).
- Gate before AMO submission: `npx web-ext lint` must pass.
- Package for AMO: `npx web-ext build` (exclude AGENTS.md and dev files).
