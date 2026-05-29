'use strict';

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

exports.changePadding = changePadding;
exports.changeSnapTarget = changeSnapTarget;
