import { getCurrentWindow } from "@tauri-apps/api/window";
import { changePadding, changeSnapTarget } from "tauri-plugin-snap-layout";

window.addEventListener("DOMContentLoaded", () => {
  const switchForm = document.getElementById("greet-form");
  const switchButton = document.getElementById("submit-button");
  const logMsg = document.getElementById("greet-msg");

  let targetingMinimize = false;

  if (switchForm && switchButton && logMsg) {
    switchForm.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!targetingMinimize) {
        // Tell the plugin to stop looking for #maximize and start looking for #minimize
        changeSnapTarget("minimize");
        // Change the amount of padding for the button
        changePadding({bottom: 10});

        
        switchButton.textContent = "Target Maximize";
        logMsg.textContent = "Plugin target changed! Cloned CSS generated. Hover over 'Min' button to test.";
        targetingMinimize = true;
      } else {
        // Return back to tracking #snap-btn (the maximize) and 0 the bottom padding.
        changeSnapTarget("snap-btn");
        changePadding({bottom: 0});
        
        switchButton.textContent = "Target Minimize";
        logMsg.textContent = "Plugin target restored to original Maximize button.";
        targetingMinimize = false;
      }
    });
  }
  document.querySelector("#close")?.addEventListener("click", async () => {
    await getCurrentWindow().close();;
  })
});