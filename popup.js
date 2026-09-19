"use strict";

document.getElementById("manage").addEventListener("click", () => {
  browser.runtime.openOptionsPage();
  window.close();
});
