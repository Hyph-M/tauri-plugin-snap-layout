function changeSnapTarget(newButtonId) {
    if (window.changeSnapTarget) {
        window.changeSnapTarget(newButtonId);
    }
}
function changePadding(options) {
    if (window.changePadding) {
        window.changePadding(options);
    }
}

export { changePadding, changeSnapTarget };
