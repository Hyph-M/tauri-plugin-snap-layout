import "./global-types";

export function changeTarget(newButtonId: string): void {
  if (typeof window !== 'undefined' && (window as any).__SNAP_LAYOUT_CHANGE_TARGET__) {
    (window as any).__SNAP_LAYOUT_CHANGE_TARGET__(newButtonId);
  }
}

export function changePadding(options: {
  left?: number,
  right?: number,
  top?: number,
  bottom?: number,
  all?: number
}): void {
  if (typeof window !== 'undefined' && (window as any).__SNAP_LAYOUT_CHANGE_PADDING__) {
    (window as any).__SNAP_LAYOUT_CHANGE_PADDING__(options);
  }
}

export function attach(newTargetId?: string): void {
  if (typeof window !== 'undefined' && (window as any).__SNAP_LAYOUT_ATTACH__) {
    (window as any).__SNAP_LAYOUT_ATTACH__(newTargetId);
  } else if (typeof window !== 'undefined') {
    console.warn('[Snap Plugin] attach called before plugin initialization or on unsupported platform.');
  }
}

export async function detach(): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).__SNAP_LAYOUT_DETACH__) {
    await (window as any).__SNAP_LAYOUT_DETACH__();
  } else if (typeof window !== 'undefined') {
    console.warn('[Snap Plugin] detach called before plugin initialization or on unsupported platform.');
  }
}

export function isAttached(): boolean {
  if (typeof window === 'undefined') return false;
  return (window as any).__SNAP_LAYOUT_IS_ATTACHED__?.() ?? false;
}