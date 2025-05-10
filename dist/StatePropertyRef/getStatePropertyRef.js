export function createRefKey(info, listIndex) {
    return `${info.id}-${listIndex?.id ?? 0}`;
}
