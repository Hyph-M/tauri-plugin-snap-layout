<p align="center">
  <img src="https://raw.githubusercontent.com/Hyph-M/tauri-plugin-snap-layout/main/assets/banner.png" alt="Project Banner" width="640">
</p>

# tauri-plugin-snap-layout

<table border="0">
  <tr>
    <!-- Left Column: The GIF (Takes up 40% of the width) -->
    <td width="40%" valign="center" align="center">
      <img src="https://raw.githubusercontent.com/Hyph-M/tauri-plugin-snap-layout/main/assets/demo.gif" alt="App Demo" width="100%">
    </td>
    <td width="60%" valign="top">
      <h3>Windows 11 Snap Layout integration for Tauri v2 frameless windows.</h3>
      <p>Places an invisible native Win32 overlay over your custom titlebar button so hovering it triggers the OS snap zones and snap assist popup — no native titlebar required. Maximize and restore are wired up automatically through the same overlay.</p>
      <p>Works transparently on non-Windows platforms — all APIs are present but do nothing, so your codebase stays cross-platform.</p>
      <p>Having multiple windows with this plugin is supported.</p>
    </td>
  </tr>
</table>

<br></br>

## Platform Support

| Platform      | Snap Layout | Multi-Window | Toggle (Attach/Detach) | Notes                        |
| ------------- | ----------- | ------------ | ---------------------- | ---------------------------- |
| Windows 11    | ✅          | ✅ Full       | ✅ Native & Frontend   | Full support (build ≥ 22000) |
| Windows 10    | ❌          | ❌ No-op     | ❌ Safe Fallback       | Plugin loads cleanly; all APIs callable, no effect |
| macOS / Linux | ❌          | ❌ No-op     | ❌ Safe Fallback       | No-op, compiles cleanly      |

<br></br>

## Installation

Add the Rust crate to your Tauri app:

```toml
# src-tauri/Cargo.toml
[dependencies]
tauri-plugin-snap-layout = "1"
```

Add the JS/TS bindings to your frontend:

```bash
npm install tauri-plugin-snap-layout
# or
pnpm add tauri-plugin-snap-layout
# or your preferred package manager
```

<br></br>

## Usage

### 1. Rust — Register the plugin and prepare required options.

Register the plugin in your `src-tauri/src/lib.rs` file:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_snap_layout::init()
                .button_id("snap-btn")
                .build()
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Set decorations to false in your `src-tauri/tauri.conf.json` file. This is done in the "windows" section.

```json
"app": {
    "windows": [
      {
        "decorations": false
      }
    ],
  },
```

Add this permission to your src-tauri/capabilities/default.json.

```json
{
  "permissions": ["snap-layout:default"]
}
```


### 2. Frontend — Add the button

Give your maximize/snap button the ID you configured in the rust setup stage:

```html
<button id="snap-btn">Max</button>
```

No initialisation required. The plugin self-initialises via the injected script when the page loads.

If you're using a bundler and have the package installed:

```typescript
import { changePadding, changeTarget, attach, detach, isAttached } from "tauri-plugin-snap-layout";

// Swap targetted button dynamically
changeTarget("new-button-id");

// Temporarily remove the Snap Zone by destroying the overlay area.
await detach();

// Re-enable the snap area, you can set a new target here as well.
attach("optional-new-target");

// Change padding
changePadding( {} );

// Get attached state
isAttached();
```

`changeTarget` needs an existing ID to transfer to and will automatically update bounds based on the target.

`changePadding` will add or remove the area of the hover zone. If using negative padding it will have a minimum width/height of 1px. If this negative padding extends past the bounds of the button it will continue to move the hover area rather than stop at the bounds of the button.

Padding fields are set, not accumulated — each call overwrites the previous passed fields. `all` acts as a baseline that can combine with per-side values at render time. The example below results in 5 on the left and 3 on all other sides.

```typescript
changePadding( {left: 2, right: 0, top: 0, bottom: 0, all:3} );
```

The options available are left, right, top, bottom, all.

If you need to call it from outside a module context (vanilla JS, inline scripts):

```typescript
window.changeTarget("new-button-id");
window.changePadding( {} );
window.detach();
window.attach();
window.isAttached();
```

**Note:** `attach`, `detach`, and `isAttached` are common names that could conflict with other libraries. In complex apps, prefer the namespaced `window.__SNAP_LAYOUT_ATTACH__` variants instead.

The same fields apply to changePadding as above.

### Optional Configuration

You can customize the bounding area, cursor, and debug mode via the Rust builder:

```rust
tauri_plugin_snap_layout::init()
    .button_id("snap-btn")
    .padding_left(0)
    .padding_right(0)
    .padding_top(0)
    .padding_bottom(0)
    .padding_all(0)
    // defaults to SnapCursor::Arrow if undefined
    .cursor(tauri_plugin_snap_layout::SnapCursor::Hand)
    // set true to show a debug overlay
    .display(false)
    .debug_color("rgba(255, 0, 0, 0.2)")
    .build()
```

### CSS Hover State

Because the native overlay intercepts pointer events, `:hover` CSS will not fire on your button naturally. The plugin automatically mirrors any `:hover` rules it finds for your button into an `.is-hovered` class, which it applies when the native window detects cursor entry. You can also write `.is-hovered` styles directly:

```css
#snap-btn:hover,
#snap-btn.is-hovered {
  background: rgba(255, 255, 255, 0.1);
}
```

### Programmatic Window Management & Multi-Window Support

**Multi-window applications** are supported. Initialization scripts run globally across all webviews and the Rust backend uses explicit `WebviewWindow` instances, every open window isolates its own tracking loops and native Win32 child bounds.
If you need to alter or toggle the snap zones in Rust, you can use the `SnapExt` extension trait on any window handle:

```rust
use tauri_plugin_snap_layout::SnapExt;

#[tauri::command]
fn manage_window_overlays(window: tauri::WebviewWindow) -> Result<(), tauri_plugin_snap_layout::Error> {
    // Remove the native Win32 child overlay on this window and stop tracking.
    window.snap().detach(&window)?;

    // Recreate overlay and resume tracking.
    window.snap().attach(&window)?;
    
    Ok(())
}
```

<br></br>

## Troubleshooting

If you see something along these lines `__SNAP_BUTTON_ID__ is not defined` in the console, add the
following to your `vite.config.ts` to prevent Vite from caching the plugin:

```typescript
export default defineConfig({
  optimizeDeps: {
    exclude: ["tauri-plugin-snap-layout"],
  },
});
```

<br></br>

## How it works

The plugin creates an invisible native Win32 child `HWND` positioned over your button. This child window returns `HTMAXBUTTON` from `WM_NCHITTEST`, which is the correct native path for triggering Windows 11's Snap Layout popup on frameless and borderless windows — no keyboard simulation or input injection.

<br></br>

## Credits

Inspired by and originally derived from:

- [tauri-plugin-frame](https://github.com/clarifei/tauri-plugin-frame) by clarifei
- [tauri-plugin-decorum](https://github.com/clearlysid/tauri-plugin-decorum) by Siddharth

<br></br>

## License

MIT — see [LICENSE](LICENSE)
