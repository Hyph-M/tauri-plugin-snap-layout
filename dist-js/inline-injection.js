(function () {
    'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol, Iterator */


    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    /**
     * Stores the callback in a known location, and returns an identifier that can be passed to the backend.
     * The backend uses the identifier to `eval()` the callback.
     *
     * @return An unique identifier associated with the callback function.
     *
     * @since 1.0.0
     */
    function transformCallback(
    // TODO: Make this not optional in v3
    callback, once = false) {
        return window.__TAURI_INTERNALS__.transformCallback(callback, once);
    }
    /**
     * Sends a message to the backend.
     * @example
     * ```typescript
     * import { invoke } from '@tauri-apps/api/core';
     * await invoke('login', { user: 'tauri', password: 'poiwe3h4r5ip3yrhtew9ty' });
     * ```
     *
     * @param cmd The command name.
     * @param args The optional arguments to pass to the command.
     * @param options The request options.
     * @return A promise resolving or rejecting to the backend response.
     *
     * @since 1.0.0
     */
    async function invoke(cmd, args = {}, options) {
        return window.__TAURI_INTERNALS__.invoke(cmd, args, options);
    }

    // Copyright 2019-2024 Tauri Programme within The Commons Conservancy
    // SPDX-License-Identifier: Apache-2.0
    // SPDX-License-Identifier: MIT
    /**
     * The event system allows you to emit events to the backend and listen to events from it.
     *
     * This package is also accessible with `window.__TAURI__.event` when [`app.withGlobalTauri`](https://v2.tauri.app/reference/config/#withglobaltauri) in `tauri.conf.json` is set to `true`.
     * @module
     */
    /**
     * @since 1.1.0
     */
    var TauriEvent;
    (function (TauriEvent) {
        TauriEvent["WINDOW_RESIZED"] = "tauri://resize";
        TauriEvent["WINDOW_MOVED"] = "tauri://move";
        TauriEvent["WINDOW_CLOSE_REQUESTED"] = "tauri://close-requested";
        TauriEvent["WINDOW_DESTROYED"] = "tauri://destroyed";
        TauriEvent["WINDOW_FOCUS"] = "tauri://focus";
        TauriEvent["WINDOW_BLUR"] = "tauri://blur";
        TauriEvent["WINDOW_SCALE_FACTOR_CHANGED"] = "tauri://scale-change";
        TauriEvent["WINDOW_THEME_CHANGED"] = "tauri://theme-changed";
        TauriEvent["WINDOW_CREATED"] = "tauri://window-created";
        TauriEvent["WINDOW_SUSPENDED"] = "tauri://suspended";
        TauriEvent["WINDOW_RESUMED"] = "tauri://resumed";
        TauriEvent["WEBVIEW_CREATED"] = "tauri://webview-created";
        TauriEvent["DRAG_ENTER"] = "tauri://drag-enter";
        TauriEvent["DRAG_OVER"] = "tauri://drag-over";
        TauriEvent["DRAG_DROP"] = "tauri://drag-drop";
        TauriEvent["DRAG_LEAVE"] = "tauri://drag-leave";
    })(TauriEvent || (TauriEvent = {}));
    /**
     * Unregister the event listener associated with the given name and id.
     *
     * @ignore
     * @param event The event name
     * @param eventId Event identifier
     * @returns
     */
    async function _unlisten(event, eventId) {
        window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(event, eventId);
        await invoke('plugin:event|unlisten', {
            event,
            eventId
        });
    }
    /**
     * Listen to an emitted event to any {@link EventTarget|target}.
     *
     * @example
     * ```typescript
     * import { listen } from '@tauri-apps/api/event';
     * const unlisten = await listen<string>('error', (event) => {
     *   console.log(`Got error, payload: ${event.payload}`);
     * });
     *
     * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
     * unlisten();
     * ```
     *
     * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
     * @param handler Event handler callback.
     * @param options Event listening options.
     * @returns A promise resolving to a function to unlisten to the event.
     * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
     *
     * @since 1.0.0
     */
    async function listen(event, handler, options) {
        var _a;
        const target = ((_a = void 0 ) !== null && _a !== void 0 ? _a : { kind: 'Any' });
        return invoke('plugin:event|listen', {
            event,
            target,
            handler: transformCallback(handler)
        }).then((eventId) => {
            return async () => _unlisten(event, eventId);
        });
    }

    let currentButtonId = __SNAP_BUTTON_ID__;
    let paddingLeft = __SNAP_PADDING_LEFT__;
    let paddingRight = __SNAP_PADDING_RIGHT__;
    let paddingTop = __SNAP_PADDING_TOP__;
    let paddingBottom = __SNAP_PADDING_BOTTOM__;
    let paddingAll = __SNAP_PADDING_ALL__;
    let mutationObserver = null;
    let resizeObserver = null;
    let rafId = null;
    let activeTarget = null;
    let debugEl = null;
    let injectedStyleEl = null;
    let unlistenEnter = null;
    let unlistenLeave = null;
    const cachedHoverRules = {};
    function automateHoverCSS(targetId) {
        if (injectedStyleEl) {
            injectedStyleEl.remove();
            injectedStyleEl = null;
        }
        if (cachedHoverRules[targetId]) {
            injectedStyleEl = document.createElement('style');
            injectedStyleEl.id = `snap-automated-css-${targetId}`;
            injectedStyleEl.textContent = cachedHoverRules[targetId];
            document.head.appendChild(injectedStyleEl);
            return;
        }
        let automatedRules = '';
        const targetSelector = `#${targetId}`;
        try {
            for (const sheet of Array.from(document.styleSheets)) {
                try {
                    if (!sheet.cssRules)
                        continue;
                }
                catch {
                    continue;
                }
                for (const rule of Array.from(sheet.cssRules)) {
                    if (rule instanceof CSSStyleRule && rule.selectorText.includes(':hover')) {
                        if (rule.selectorText.includes(targetSelector) || rule.selectorText.includes('button')) {
                            const newSelector = rule.selectorText.replace(/:hover/g, '.is-hovered');
                            automatedRules += `${newSelector} { ${rule.style.cssText} }\n`;
                        }
                    }
                }
            }
            if (automatedRules) {
                cachedHoverRules[targetId] = automatedRules;
                injectedStyleEl = document.createElement('style');
                injectedStyleEl.id = `snap-automated-css-${targetId}`;
                injectedStyleEl.textContent = automatedRules;
                document.head.appendChild(injectedStyleEl);
            }
        }
        catch (e) {
            console.warn('[Snap Plugin] Failed to automate CSS shadowing due to stylesheet restrictions:', e);
        }
    }
    const syncBounds = () => {
        if (!activeTarget)
            return;
        if (rafId !== null)
            return;
        rafId = requestAnimationFrame(() => {
            if (!activeTarget) {
                rafId = null;
                return;
            }
            const rect = activeTarget.getBoundingClientRect();
            const paddedX = Math.round(rect.left) - paddingLeft - paddingAll;
            const paddedY = Math.round(rect.top) - paddingTop - paddingAll;
            const paddedWidth = Math.max(Math.round(rect.width) + paddingLeft + paddingRight + (paddingAll * 2), 1);
            const paddedHeight = Math.max(Math.round(rect.height) + paddingTop + paddingBottom + (paddingAll * 2), 1);
            invoke('plugin:snap-layout|update_snap_bounds', {
                x: paddedX,
                y: paddedY,
                width: paddedWidth,
                height: paddedHeight,
            }).catch(console.error);
            if (debugEl) {
                Object.assign(debugEl.style, {
                    display: 'block',
                    left: `${paddedX}px`,
                    top: `${paddedY}px`,
                    width: `${paddedWidth}px`,
                    height: `${paddedHeight}px`,
                });
            }
            rafId = null;
        });
    };
    const unbindTarget = () => {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
        window.removeEventListener('resize', syncBounds);
        if (debugEl)
            debugEl.style.display = 'none';
        if (activeTarget) {
            activeTarget.classList.remove('is-hovered');
            activeTarget = null;
        }
        if (injectedStyleEl) {
            injectedStyleEl.remove();
            injectedStyleEl = null;
        }
    };
    const bindTarget = (target) => {
        if (activeTarget === target)
            return;
        unbindTarget();
        activeTarget = target;
        automateHoverCSS(currentButtonId);
        resizeObserver = new ResizeObserver(syncBounds);
        resizeObserver.observe(target);
        resizeObserver.observe(document.body);
        window.addEventListener('resize', syncBounds, { passive: true });
        syncBounds();
    };
    function changeSnapTarget(newButtonId) {
        if (!newButtonId || currentButtonId === newButtonId)
            return;
        console.log(`[Snap Plugin] Swapping active tracking target ID from #${currentButtonId} to #${newButtonId}`);
        unbindTarget();
        currentButtonId = newButtonId;
        const target = document.getElementById(currentButtonId);
        if (target)
            bindTarget(target);
    }
    function changePadding(options) {
        if (options.left !== undefined)
            paddingLeft = options.left;
        if (options.right !== undefined)
            paddingRight = options.right;
        if (options.top !== undefined)
            paddingTop = options.top;
        if (options.bottom !== undefined)
            paddingBottom = options.bottom;
        if (options.all !== undefined)
            paddingAll = options.all;
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        syncBounds();
    }
    async function initSnapLayout() {
        if (window.__snapLayoutInit)
            return;
        window.__snapLayoutInit = true;
        window.changeSnapTarget = changeSnapTarget;
        window.changePadding = changePadding;
        const debugEnabled = __SNAP_DISPLAY__;
        const debugColor = __SNAP_DEBUG_COLOR__ || 'rgba(255, 0, 0, 0.4)';
        if (debugEnabled && !debugEl) {
            debugEl = document.createElement('div');
            Object.assign(debugEl.style, {
                position: 'fixed',
                zIndex: '2147483647',
                backgroundColor: debugColor,
                border: '1px dashed #ff0000',
                boxSizing: 'border-box',
                pointerEvents: 'none',
            });
            document.body.appendChild(debugEl);
        }
        unlistenEnter = await listen('tauri-snap://snap/mouseenter', () => {
            if (activeTarget)
                activeTarget.classList.add('is-hovered');
        });
        unlistenLeave = await listen('tauri-snap://snap/mouseleave', () => {
            if (activeTarget)
                activeTarget.classList.remove('is-hovered');
        });
        mutationObserver = new MutationObserver(() => {
            if (activeTarget && document.contains(activeTarget))
                return;
            const target = document.getElementById(currentButtonId);
            if (target) {
                bindTarget(target);
            }
            else {
                unbindTarget();
            }
        });
        mutationObserver.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        const initialTarget = document.getElementById(currentButtonId);
        if (initialTarget)
            bindTarget(initialTarget);
        window.addEventListener('unload', () => {
            if (mutationObserver)
                mutationObserver.disconnect();
            unbindTarget();
            if (debugEl)
                debugEl.remove();
            if (unlistenEnter)
                unlistenEnter();
            if (unlistenLeave)
                unlistenLeave();
        }, { once: true });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSnapLayout, { once: true });
    }
    else {
        initSnapLayout();
    }

})();
