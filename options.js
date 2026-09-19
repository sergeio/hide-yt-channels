"use strict";

const CHANNELS_KEY = "channels";
const VIDEOS_KEY = "videos";

function renderList(listEl, values, key) {
  listEl.textContent = "";
  if (!values.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Nothing hidden yet.";
    listEl.append(li);
    return;
  }
  for (const value of values) {
    const li = document.createElement("li");
    const code = document.createElement("code");
    code.textContent = value;
    const btn = document.createElement("button");
    btn.textContent = "Unhide";
    btn.addEventListener("click", () => removeValue(key, value));
    li.append(code, btn);
    listEl.append(li);
  }
}

async function removeValue(key, value) {
  const stored = await browser.storage.local.get({ [key]: [] });
  await browser.storage.local.set({
    [key]: stored[key].filter((v) => v !== value),
  });
}

async function renderAll() {
  const stored = await browser.storage.local.get({
    [CHANNELS_KEY]: [],
    [VIDEOS_KEY]: [],
  });
  renderList(document.getElementById("channel-list"), stored[CHANNELS_KEY], CHANNELS_KEY);
  renderList(document.getElementById("video-list"), stored[VIDEOS_KEY], VIDEOS_KEY);
}

browser.storage.onChanged.addListener(renderAll);
renderAll();
