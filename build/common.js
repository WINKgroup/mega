"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBytesByChildren = void 0;
function getBytesByChildren(dir) {
    if (dir.type === 'file')
        return dir.bytes !== undefined ? dir.bytes : false;
    var bytes = 0;
    if (dir.children) {
        for (var _i = 0, _a = dir.children; _i < _a.length; _i++) {
            var file = _a[_i];
            var childBytes = getBytesByChildren(file);
            if (childBytes === false)
                return false;
            bytes += childBytes;
        }
    }
    return bytes;
}
exports.getBytesByChildren = getBytesByChildren;
