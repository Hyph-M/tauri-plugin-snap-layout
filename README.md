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
      <p>Overlays an invisible native Win32 child window over a frontend button so that hovering it triggers the OS Snap Layout popup natively, without requiring a native titlebar.</p>
      <p>Works transparently on non-Windows platforms — all APIs are present but do nothing, so your codebase stays cross-platform.</p>
    </td>
  </tr>
</table>
Because of the nature of the overlay intercepting the mouse cursor, maximize/restore functionality is automatically attached to the area.

## Platform Support

| Platform      | Snap Layout | Mouse Events | Maximize Toggle | Notes                        |
| ------------- | ----------- | ------------ | --------------- | ---------------------------- |
| Windows 11    | ✅          | Intercepted  | ✅              | Full support (build ≥ 22000) |
| Windows 10    | ❌          | Normal       | ❌              | Plugin loads, no-op          |
| macOS / Linux | ❌          | Normal       | ❌              | No-op, compiles cleanly      |

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
import { changePadding, changeSnapTarget } from "tauri-plugin-snap-layout";
changeSnapTarget("new-button-id");
changePadding( {left: 0} )
```

changeSnapTarget needs an existing ID to transfer to and will automatically update bounds based on the target.

changePadding will add or remove the area of the hover zone. If using negative padding it will have a minimum width/height of 1px. If this negative padding extends past the bounds of the button it will continue to move the hover area rather than stop at the bounds of the button.
The padding applied is additive, so the below will result in 5 padding on the left, and 3 on all other sides.
The options available are left, right, top, bottom, all.

```typescript
changePadding( {left: 2, right: 0, top: 0, bottom: 0, all:3} )
```

If you need to call it from outside a module context (vanilla JS, inline scripts):

```typescript
window.changeSnapTarget("new-button-id");
window.changePadding( { } )
```

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

## Programmatic Detach (Rust only)

If you need to programmatically destroy the native Win32 child window while the parent window remains open, you can use the `SnapExt` trait:

```rust
use tauri_plugin_snap_layout::SnapExt;

// Detaches the native snap zone from the specified window
window.snap().detach_snap_zone(&window)?;
```

## Troubleshooting

If you see `__SNAP_BUTTON_ID__ is not defined` in the console, add the
following to your `vite.config.ts` to prevent Vite from caching the plugin:

```typescript
export default defineConfig({
  optimizeDeps: {
    exclude: ["tauri-plugin-snap-layout"],
  },
});
```

## How it works

The plugin creates an invisible native Win32 child `HWND` positioned over your button. This child window returns `HTMAXBUTTON` from `WM_NCHITTEST`, which is the correct native path for triggering Windows 11's Snap Layout popup on frameless and borderless windows — no keyboard simulation or input injection."

## Credits

Inspired by and originally derived from:

- [tauri-plugin-frame](https://github.com/clarifei/tauri-plugin-frame) by clarifei
- [tauri-plugin-decorum](https://github.com/clearlysid/tauri-plugin-decorum) by Siddharth

## License

MIT — see [LICENSE](LICENSE)
