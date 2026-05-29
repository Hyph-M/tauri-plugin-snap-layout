import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

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
let mutationObserver: MutationObserver | null = null;
let resizeObserver: ResizeObserver | null = null;
let rafId: number | null = null;
let activeTarget: HTMLElement | null = null;
let debugEl: HTMLDivElement | null = null;
let injectedStyleEl: HTMLStyleElement | null = null;

let unlistenEnter: UnlistenFn | null = null;
let unlistenLeave: UnlistenFn | null = null;

const cachedHoverRules: Record<string, string> = {};

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

function changeSnapTarget(newButtonId: string): void {
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

  (window as any).changeSnapTarget = changeSnapTarget;
  (window as any).changePadding = changePadding;

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
    if (activeTarget) activeTarget.classList.add('is-hovered');
  });

  unlistenLeave = await listen('tauri-snap://snap/mouseleave', () => {
    if (activeTarget) activeTarget.classList.remove('is-hovered');
  });

  mutationObserver = new MutationObserver(() => {
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

  window.addEventListener('unload', () => {
    if (mutationObserver) mutationObserver.disconnect();
    unbindTarget();
    if (debugEl) debugEl.remove();
    if (unlistenEnter) unlistenEnter();
    if (unlistenLeave) unlistenLeave();
  }, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSnapLayout, { once: true });
} else {
  initSnapLayout();
}