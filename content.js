"use strict";

const CHANNELS_KEY = "channels";
const VIDEOS_KEY = "videos";
const PROCESSED_FLAG = "hycProcessed";
const BTN_CLASS = "hyc-btn";

const ITEM_SELECTOR = [
  "ytd-rich-item-renderer",
  "ytd-video-renderer",
  "ytd-compact-video-renderer",
  "ytd-grid-video-renderer",
].join(",");

const AD_SELECTOR =
  "ytd-ad-slot-renderer, ytd-player-ad-renderer, ytd-display-ad-renderer";

const VIDEO_ID_RE = /(?:[?&]v=|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/;

const hiddenChannels = new Set();
const hiddenVideos = new Set();
let storageReady = false;

async function loadHidden() {
  const stored = await browser.storage.local.get({
    [CHANNELS_KEY]: [],
    [VIDEOS_KEY]: [],
  });
  hiddenChannels.clear();
  hiddenVideos.clear();
  for (const v of stored[CHANNELS_KEY]) hiddenChannels.add(v);
  for (const v of stored[VIDEOS_KEY]) hiddenVideos.add(v);
}

function persist() {
  return browser.storage.local.set({
    [CHANNELS_KEY]: [...hiddenChannels],
    [VIDEOS_KEY]: [...hiddenVideos],
  });
}

browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes[CHANNELS_KEY]) {
    hiddenChannels.clear();
    for (const v of changes[CHANNELS_KEY].newValue ?? []) hiddenChannels.add(v);
  }
  if (changes[VIDEOS_KEY]) {
    hiddenVideos.clear();
    for (const v of changes[VIDEOS_KEY].newValue ?? []) hiddenVideos.add(v);
  }
  scheduleProcess();
});

function videoIdFromHref(href) {
  if (!href) return null;
  const m = VIDEO_ID_RE.exec(href);
  return m ? m[1] : null;
}

function channelIdentifierFromHref(href) {
  if (!href) return null;
  if (href.startsWith("/channel/")) {
    const id = href.split("/")[2];
    if (id && id.startsWith("UC")) return id;
  }
  if (href.startsWith("/@")) return href.slice(1);
  if (href.startsWith("/c/") || href.startsWith("/user/")) return href;
  return null;
}

function extractIdentifiers(item) {
  let videoId = null;
  let channel = null;
  for (const a of item.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href");
    if (!videoId) videoId = videoIdFromHref(href);
    if (!channel) channel = channelIdentifierFromHref(href);
    if (videoId && channel) break;
  }
  if (!channel) {
    const nameEl = item.querySelector("ytd-channel-name");
    const text = nameEl ? nameEl.textContent.trim() : "";
    if (text) channel = text;
  }
  return { videoId, channel };
}

function outermostItem(el) {
  let node = el;
  for (;;) {
    const parent = node.parentElement && node.parentElement.closest(ITEM_SELECTOR);
    if (!parent) return node;
    node = parent;
  }
}

function scheduleProcess() {
  if (processTimer) clearTimeout(processTimer);
  processTimer = setTimeout(() => {
    processTimer = 0;
    processAll();
  }, 200);
}

let processTimer = 0;

function processAll() {
  if (!storageReady) return;
  for (const el of document.querySelectorAll(ITEM_SELECTOR)) {
    if (el.dataset[PROCESSED_FLAG]) continue;
    const outer = outermostItem(el);
    if (outer !== el) continue;
    if (outer.closest(AD_SELECTOR)) {
      outer.dataset[PROCESSED_FLAG] = "1";
      continue;
    }
    const { videoId, channel } = extractIdentifiers(outer);
    if (
      (channel && hiddenChannels.has(channel)) ||
      (videoId && hiddenVideos.has(videoId))
    ) {
      outer.remove();
      continue;
    }
    if (videoId) {
      injectButtons(outer, videoId, channel);
      outer.dataset[PROCESSED_FLAG] = "1";
    }
  }
}

function makeButton(kind, title) {
  const btn = document.createElement("button");
  btn.className = `${BTN_CLASS} hyc-${kind}`;
  btn.textContent = "\u00d7";
  btn.title = title;
  btn.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      handleHide(e.currentTarget, kind);
    },
    true
  );
  return btn;
}

async function handleHide(btn, kind) {
  const item = outermostItem(btn.closest(ITEM_SELECTOR));
  if (!item) return;
  const { videoId, channel } = extractIdentifiers(item);
  if (kind === "channel" && channel) hiddenChannels.add(channel);
  if (kind === "video" && videoId) hiddenVideos.add(videoId);
  item.remove();
  await persist();
  processAll();
}

function injectButtons(item, videoId, channel) {
  if (channel) {
    const anchor =
      item.querySelector("#channel-name a") ||
      item.querySelector("ytd-channel-name a");
    if (anchor && !(anchor.nextElementSibling && anchor.nextElementSibling.classList.contains(BTN_CLASS))) {
      anchor.insertAdjacentElement("afterend", makeButton("channel", "Hide this channel"));
    }
  }
  const title =
    item.querySelector("a#video-title-link") ||
    item.querySelector("a#video-title") ||
    item.querySelector("h3 a");
  if (title && !(title.nextElementSibling && title.nextElementSibling.classList.contains(BTN_CLASS))) {
    title.insertAdjacentElement("afterend", makeButton("video", "Hide this video"));
  }
}

new MutationObserver(scheduleProcess).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

document.addEventListener("yt-navigate-finish", scheduleProcess, true);

loadHidden().then(() => {
  storageReady = true;
  scheduleProcess();
});
