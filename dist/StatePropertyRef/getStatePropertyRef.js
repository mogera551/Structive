export function createRefKey(info, listIndex) {
    return (listIndex == null) ? info.sid : (info.sid + "#" + listIndex.sid);
}
export function getStatePropertyRefKey(path, listIndex) {
    if (listIndex === null) {
        return path;
    }
    else {
        return path + "." + listIndex.index + "#" + listIndex.sid;
    }
}
