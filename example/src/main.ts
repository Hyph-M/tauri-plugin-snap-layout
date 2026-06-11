import { getCurrentWindow } from "@tauri-apps/api/window";
import { changePadding, changeTarget, attach, detach, isAttached } from "tauri-plugin-snap-layout";
import { invoke } from "@tauri-apps/api/core";

const appWindow = getCurrentWindow();

window.addEventListener("DOMContentLoaded", () => {
  const switchForm = document.getElementById("greet-form");
  const switchButton = document.getElementById("snap-switch-button");
  const createWindowButton = document.getElementById("create-window-button");
  const logMsg = document.getElementById("greet-msg");

  let targetingMinimize = false;

  if (switchForm && switchButton && logMsg) {
    switchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!isAttached()) return;

      if (!targetingMinimize) {
        // Tell the plugin to stop looking for #maximize and start looking for #minimize
        changeTarget("minimize");
        // Change the amount of padding for the button
        changePadding({ bottom: 10 });
        window.snapLayout?.changePadding({ left: 10 })
        
        switchButton.textContent = "Target Maximize";
        logMsg.textContent = "Plugin target changed! Cloned CSS generated. Hover over 'Min' button to test.";
        targetingMinimize = true;
      } else {
        // Return back to tracking #snap-btn (the maximize) and 0 the bottom and left padding.
        changeTarget("snap-btn");
        changePadding({ bottom: 0 });
        window.snapLayout?.changePadding({left: 0})
        
        switchButton.textContent = "Target Minimize";
        logMsg.textContent = "Plugin target restored to original Maximize button.";
        targetingMinimize = false;
      }
    });
  }

  if (createWindowButton) {
    createWindowButton.addEventListener("click", async () => {
      await invoke('create_window');
    })
  }
  
  // Set secondary window default to create window button instead
  if (appWindow.label === "secondary") {
    console.log("secondary window, changing snap button")
    changeTarget("create-window-button");
  }

  // minimize
  document.querySelector("#minimize")?.addEventListener("click", () => appWindow.minimize())

  
  document.querySelector("#toggle-snap")?.addEventListener("click", async () => {
    if (isAttached()) {
      console.log('Trying to detach with backend.')
      detach();
    }
    else {
      console.log('Trying to attach with backend.')
      attach();
    }
  })

  document.querySelector("#close")?.addEventListener("click", async () => {
    await getCurrentWindow().close();;
  })
});