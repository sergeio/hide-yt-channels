"use strict";

const CHANNELS_KEY = "channels";

function renderList(listEl, values) {
  listEl.textContent = "";
  if (!values.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No channels hidden yet.";
    listEl.append(li);
    return;
  }
  for (const value of values) {
    const li = document.createElement("li");
    const code = document.createElement("code");
    code.textContent = value;
    const btn = document.createElement("button");
    btn.textContent = "Unhide";
    btn.addEventListener("click", () => removeChannel(value));
    li.append(code, btn);
    listEl.append(li);
  }
}

async function removeChannel(value) {
  const stored = await browser.storage.local.get({ [CHANNELS_KEY]: [] });
  await browser.storage.local.set({
    [CHANNELS_KEY]: stored[CHANNELS_KEY].filter((v) => v !== value),
  });
}

async function renderAll() {
  const stored = await browser.storage.local.get({ [CHANNELS_KEY]: [] });
  renderList(document.getElementById("channel-list"), stored[CHANNELS_KEY]);
}

browser.storage.onChanged.addListener(renderAll);
renderAll();
