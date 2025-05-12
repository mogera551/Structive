export function createDependencyKey(info, type) {
    return `${info.pattern}@${type}`;
}
const cache = {};
;
export function createDependencyEdge(info, type) {
    const key = createDependencyKey(info, type);
    return cache[key] ?? (cache[key] = { info, type });
}
