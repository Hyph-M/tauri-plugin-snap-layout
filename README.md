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

### Optional Initial Configuration

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
<br></br>

### 2. Frontend — Add the button

Give your maximize/snap button the ID you configured in the rust setup stage:

```html
<button id="snap-btn">Max</button>
```

No initialisation required. The plugin self-initialises via the injected script when the page loads.

If you're using a bundler and have the package installed:

```typescript
import { changePadding, changeTarget, attach, detach, isAttached } from "tauri-plugin-snap-layout";

// Swap targetted button dynamically at runtime
changeTarget("new-button-id");

// Temporarily remove the Snap Zone by destroying the overlay area.
await detach();

// Re-enable the snap area, you can set a new target here as well.
attach("optional-new-target");

// Update layout padding offsets dynamically
changePadding( {} );

// Check if the native snap zone layout is currently active
isAttached();
```

`changeTarget` needs an existing ID to transfer to and will automatically update bounds based on the target.

`changePadding` will add or remove the area of the hover zone. If using negative padding it will have a minimum width/height of 1px. If this negative padding extends past the bounds of the button it will continue to move the hover area rather than stop at the bounds of the button.

Padding fields are set, not accumulated — each call overwrites the previous passed fields. `all` acts as a baseline that can combine with per-side values at render time. The example below results in 5 on the left and 3 on all other sides.

```typescript
changePadding( {left: 2, right: 0, top: 0, bottom: 0, all:3} );
```

The options available are left, right, top, bottom, all.

### Dynamically Hiding the Button
You do not need to manually detach the native overlay if you want to temporarily hide your snap button. If you hide your button using CSS (e.g. `display: none`), the plugin will automatically detect this and shrink the native hit-test zone to 0x0. When you make the button visible again, the native snap layout zone will instantly restore itself.

### Note for Framework Users (Svelte/React/Vue/etc.):

If you are using a bundler (Vite, Webpack, etc.), always use the module imports (import { ... } from "tauri-plugin-snap-layout") shown above. The window.snapLayout global is intended strictly for plain HTML/JS setups and may be unavailable during component initialization in modular frameworks.
<br></br>

### Vanilla JavaScript Usage (Global Namespace)

For simple projects without a build step, the plugin provides an optional global API via `window.snapLayout`. For all production applications using a framework, use the module imports instead.

Because this plugin targets native Windows 11 functionality, `window.snapLayout` will be `undefined` on unsupported operating systems (like macOS or Linux). To ensure your application remains safely cross-platform without throwing runtime errors, **always use optional chaining (`?.`)** when invoking the plugin:

```javascript
// Swap targetted button dynamically at runtime
window.snapLayout?.changeTarget("new-button-id");

// Temporarily remove the Snap Zone by destroying the overlay area.
window.snapLayout?.detach();

// Re-enable the snap area, you can set a new target here as well.
window.snapLayout?.attach("your-titlebar-maximize-button-id");

// Update layout padding offsets dynamically
window.snapLayout?.changePadding( {} );

// Check if the native snap zone layout is currently active
window.snapLayout?.isAttached();
```

The same fields apply to changePadding as the bundled version above.
<br></br>

### CSS Hover State

Because the native overlay intercepts pointer events, `:hover` CSS will not fire on your button naturally. The plugin automatically mirrors any `:hover` rules it finds for your button into an `.is-hovered` class, which it applies when the native window detects cursor entry. You can also write `.is-hovered` styles directly:

```css
#snap-btn:hover,
#snap-btn.is-hovered {
  background: rgba(255, 255, 255, 0.1);
}
```

**Tailwind CSS**

Tailwind doesn't generate `:hover` rules in stylesheets, so the automatic mirroring has nothing to pick up. Define a custom variant instead:

```js
// tailwind.config.js
const plugin = require('tailwindcss/plugin');
module.exports = {
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('snap-hover', '&.is-hovered');
    }),
  ],
};
```

Then apply it on your button:

```html
<button id="snap-btn" class="snap-hover:bg-white/10 snap-hover:scale-110 ...">
```

> Tailwind integrations have not been tested exhaustively. If you run into issues, please open an issue on GitHub.

**CSS-in-JS (Emotion, styled-components)**

Styles injected after component mount are handled automatically. The plugin watches for late-injected stylesheets and re-scans when they appear, so no extra configuration is needed.

> CSS-in-JS integrations have not been tested exhaustively. If you run into issues, please open an issue on GitHub.

**Shadow DOM**

Elements inside a shadow root are not supported for `.is-hovered` CSS automation. The Win32 hit-test overlay will still track position correctly, but hover styles must be applied manually via the Tauri events `tauri-snap://snap/mouseenter` and `tauri-snap://snap/mouseleave` if needed.
<br></br>

### Programmatic Window Management & Multi-Window Support

**Multi-window applications** are supported. Initialization scripts run globally across all webviews and the Rust backend uses explicit `WebviewWindow` instances, every open window isolates its own tracking loops and native Win32 child bounds.
If you need to alter or toggle the snap zones in Rust, you can use the `SnapExt` extension trait on any window handle:

```rust
use tauri_plugin_snap_layout::SnapExt;

#[tauri::command]
fn manage_window_overlays(window: tauri::WebviewWindow) -> Result<(), tauri_plugin_snap_layout::Error> {
    // snap() retrieves the plugin state;
    // the window is passed separately as the target

    // Remove the native Win32 child overlay on this window and stop tracking.
    window.snap().detach(&window)?;

    // Recreate overlay and resume tracking.
    window.snap().attach(&window)?;
    
    Ok(())
}
```
<br></br>

### Note on Initial Load Timing

Because this plugin relies on your frontend JavaScript to measure the DOM button and pass its coordinates to the native OS, there is a tiny delay (usually just a few milliseconds) on application startup before the snap zone becomes active.

If you want to prevent this micro-delay entirely before the snap zone is perfectly positioned, you can use the standard Tauri "Hidden Window" pattern: set "visible": false in your tauri.conf.json, and then call appWindow.show() in your frontend code once your UI has mounted.
<br></br>

## Troubleshooting


**Why is window.snapLayout undefined?**

Answer: You are likely using a bundler. Use import { attach } from "..." instead. If you are on macOS/Linux, the plugin is not supported and the object will remain undefined.

**How do I use this in Svelte/React?**

Answer: Always use the import syntax. Do not rely on window.snapLayout.

**What are other potential issues?**

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
