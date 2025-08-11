export function createRefKey(info, listIndex) {
    return (listIndex == null) ? info.pattern : (info.pattern + "#" + listIndex.sid);
}
