import { invoke } from '@tauri-apps/api/core';
import { UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';

declare const __SNAP_BUTTON_ID__: string; 
declare const __SNAP_DISPLAY__: boolean;
declare const __SNAP_DEBUG_COLOR__: string;
declare const __SNAP_PADDING_LEFT__: number;
declare const __SNAP_PADDING_RIGHT__: number;
declare const __SNAP_PADDING_TOP__: number;
declare const __SNAP_PADDING_BOTTOM__: number;
declare const __SNAP_PADDING_ALL__: number;

let currentButtonId = __SNAP_BUTTON_ID__;
let paddingLeft = __SNAP_PADDING_LEFT__;
let paddingRight = __SNAP_PADDING_RIGHT__;
let paddingTop = __SNAP_PADDING_TOP__;
let paddingBottom = __SNAP_PADDING_BOTTOM__;
let paddingAll = __SNAP_PADDING_ALL__;
let headObserver: MutationObserver | null = null;
let mutationObserver: MutationObserver | null = null;
let resizeObserver: ResizeObserver | null = null;
let rafId: number | null = null;
let activeTarget: HTMLElement | null = null;
let debugEl: HTMLDivElement | null = null;
let injectedStyleEl: HTMLStyleElement | null = null;

let isAttached = true;
let unlistenAttach: UnlistenFn | null = null;
let unlistenDetach: UnlistenFn | null = null;
let unlistenEnter: UnlistenFn | null = null;
let unlistenLeave: UnlistenFn | null = null;

// Per-ID cache of generated .is-hovered rules. Invalidated by headObserver when new
// stylesheets are injected. Not invalidated on changeTarget — the headObserver handles
// that if stylesheets changed in the interim.
const cachedHoverRules: Record<string, string> = {};

// CSS framework compatibility: see README's CSS Hover State
function automateHoverCSS(targetId: string) {
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
      try { if (!sheet.cssRules) continue; } catch { continue; }

      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSStyleRule && rule.selectorText.includes(':hover')) {
          if (rule.selectorText.includes(targetSelector)) {
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
  } catch (e) {
    console.warn('[Snap Plugin] Failed to automate CSS shadowing due to stylesheet restrictions:', e);
  }
}

const syncBounds = () => {
  if (!activeTarget) return;
  if (rafId !== null) return;

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
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
  window.removeEventListener('resize', syncBounds);
  if (debugEl) debugEl.style.display = 'none';
  
  if (activeTarget) {
    activeTarget.classList.remove('is-hovered');
    activeTarget = null;
  }

  if (injectedStyleEl) {
    injectedStyleEl.remove();
    injectedStyleEl = null;
  }
};

const bindTarget = (target: HTMLElement) => {
  if (activeTarget === target) return;
  unbindTarget();

  activeTarget = target;
  automateHoverCSS(currentButtonId);

  resizeObserver = new ResizeObserver(syncBounds);
  resizeObserver.observe(target);
  resizeObserver.observe(document.body); 
  
  window.addEventListener('resize', syncBounds, { passive: true });
  syncBounds();
};

function changeTarget(newButtonId: string): void {
  if (!newButtonId || currentButtonId === newButtonId) return;
  
  console.log(`[Snap Plugin] Swapping active tracking target ID from #${currentButtonId} to #${newButtonId}`);
  unbindTarget();
  currentButtonId = newButtonId;
  
  const target = document.getElementById(currentButtonId);
  if (target) bindTarget(target);
}

function changePadding(options: {
  left?: number,
  right?: number,
  top?: number,
  bottom?: number,
  all?: number
}) {
  if (options.left !== undefined) paddingLeft = options.left;
  if (options.right !== undefined) paddingRight = options.right;
  if (options.top !== undefined) paddingTop = options.top;
  if (options.bottom !== undefined) paddingBottom = options.bottom;
  if (options.all !== undefined) paddingAll = options.all;
  
  if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
  }
  syncBounds();
}

async function initSnapLayout(): Promise<void> {
  if ((window as any).__snapLayoutInit) return;
  (window as any).__snapLayoutInit = true;

  (window as any).__SNAP_LAYOUT_CHANGE_TARGET__ = changeTarget;
  (window as any).__SNAP_LAYOUT_CHANGE_PADDING__ = changePadding;
  (window as any).__SNAP_LAYOUT_ATTACH__ = attach;
  (window as any).__SNAP_LAYOUT_DETACH__ = detach;
  (window as any).__SNAP_LAYOUT_IS_ATTACHED__ = () => isAttached;

  // Clean Public Global API for Vanilla JS / Global Contexts
  (window as any).snapLayout = { attach, detach, changeTarget, changePadding, isAttached };

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

  async function detach() {
    if (!isAttached) return;
    isAttached = false;

    unbindTarget()

    try {
      await invoke('plugin:snap-layout|detach_snap_bounds');
    } catch (e) {
      console.error('[Snap Plugin] failed to detach bounds:', e);
    }
  }

  function attach(newTargetId?: string) {
    isAttached = true;

    if (newTargetId) currentButtonId = newTargetId;

    const target = document.getElementById(currentButtonId);
    if (target) bindTarget(target);
  }

  const appWindow = getCurrentWindow();

  unlistenEnter = await appWindow.listen('tauri-snap://snap/mouseenter', () => {
    if (activeTarget) activeTarget.classList.add('is-hovered');
  });

  unlistenLeave = await appWindow.listen('tauri-snap://snap/mouseleave', () => {
    if (activeTarget) activeTarget.classList.remove('is-hovered');
  });

  unlistenAttach = await appWindow.listen('tauri-snap://frontend-attach', () => {
    attach();
  });
  
  unlistenDetach = await appWindow.listen('tauri-snap://frontend-detach', () => {
    detach();
  });

  // Handles CSS-in-JS libraries (Emotion, styled-components) that inject <style> tags
  // into <head> after initial bind, which automateHoverCSS would otherwise miss.
  headObserver = new MutationObserver((mutations) => {
    if (!activeTarget) return;
    const hasNewStyles = mutations.some(m =>
      Array.from(m.addedNodes).some(n =>
        n instanceof HTMLStyleElement || n instanceof HTMLLinkElement
      )
    );
    if (hasNewStyles) {
      delete cachedHoverRules[currentButtonId];
      automateHoverCSS(currentButtonId);
    }
  });
  headObserver.observe(document.head, { childList: true });

  mutationObserver = new MutationObserver(() => {
    if (!isAttached) return;
    if (activeTarget && document.contains(activeTarget)) return;

    const target = document.getElementById(currentButtonId);
    if (target) {
      bindTarget(target);
    } else {
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
  if (initialTarget) bindTarget(initialTarget);

  window.addEventListener('pagehide', () => {
    if (mutationObserver) mutationObserver.disconnect();
    if (headObserver) headObserver.disconnect();
    unbindTarget();
    if (debugEl) debugEl.remove();
    if (unlistenEnter) unlistenEnter();
    if (unlistenLeave) unlistenLeave();
    if (unlistenAttach) unlistenAttach();
    if (unlistenDetach) unlistenDetach();
  }, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSnapLayout, { once: true });
} else {
  initSnapLayout();
}