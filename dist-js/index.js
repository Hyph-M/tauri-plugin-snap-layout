function changeTarget(newButtonId) {
    if (typeof window !== 'undefined' && window.__SNAP_LAYOUT_CHANGE_TARGET__) {
        window.__SNAP_LAYOUT_CHANGE_TARGET__(newButtonId);
    }
}
function changePadding(options) {
    if (typeof window !== 'undefined' && window.__SNAP_LAYOUT_CHANGE_PADDING__) {
        window.__SNAP_LAYOUT_CHANGE_PADDING__(options);
    }
}
function attach(newTargetId) {
    if (typeof window !== 'undefined' && window.__SNAP_LAYOUT_ATTACH__) {
        window.__SNAP_LAYOUT_ATTACH__(newTargetId);
    }
    else if (typeof window !== 'undefined') {
        console.warn('[Snap Plugin] attach called before plugin initialization or on unsupported platform.');
    }
}
async function detach() {
    if (typeof window !== 'undefined' && window.__SNAP_LAYOUT_DETACH__) {
        await window.__SNAP_LAYOUT_DETACH__();
    }
    else if (typeof window !== 'undefined') {
        console.warn('[Snap Plugin] detach called before plugin initialization or on unsupported platform.');
    }
}
function isAttached() {
    if (typeof window === 'undefined')
        return false;
    return window.__SNAP_LAYOUT_IS_ATTACHED__?.() ?? false;
}

export { attach, changePadding, changeTarget, detach, isAttached };
