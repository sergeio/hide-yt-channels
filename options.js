"use strict";

const CHANNELS_KEY = "channels";
const WORDS_KEY = "words";

function renderList(listEl, values, emptyText, buttonLabel, onRemove) {
  listEl.textContent = "";
  if (!values.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = emptyText;
    listEl.append(li);
    return;
  }
  for (const value of values) {
    const li = document.createElement("li");
    const code = document.createElement("code");
    code.textContent = value;
    const btn = document.createElement("button");
    btn.textContent = buttonLabel;
    btn.addEventListener("click", () => onRemove(value));
    li.append(code, btn);
    listEl.append(li);
  }
}

function removeFromList(key, value) {
  return browser.storage.local
    .get({ [key]: [] })
    .then((stored) =>
      browser.storage.local.set({
        [key]: stored[key].filter((v) => v !== value),
      })
    );
}

function addWord() {
  const input = document.getElementById("word-input");
  const word = input.value.trim().toLowerCase();
  if (!word) return;
  browser.storage.local
    .get({ [WORDS_KEY]: [] })
    .then((stored) => {
      if (stored[WORDS_KEY].includes(word)) return;
      return browser.storage.local.set({
        [WORDS_KEY]: [...stored[WORDS_KEY], word],
      });
    })
    .then(() => {
      input.value = "";
      input.focus();
    });
}

async function renderAll() {
  const stored = await browser.storage.local.get({
    [CHANNELS_KEY]: [],
    [WORDS_KEY]: [],
  });
  renderList(
    document.getElementById("channel-list"),
    stored[CHANNELS_KEY],
    "No channels hidden yet.",
    "Unhide",
    (value) => removeFromList(CHANNELS_KEY, value)
  );
  renderList(
    document.getElementById("word-list"),
    stored[WORDS_KEY],
    "No banned words.",
    "Remove",
    (value) => removeFromList(WORDS_KEY, value)
  );
}

document.getElementById("word-add").addEventListener("click", addWord);
document
  .getElementById("word-input")
  .addEventListener("keydown", (e) => {
    if (e.key === "Enter") addWord();
  });

browser.storage.onChanged.addListener(renderAll);
renderAll();
