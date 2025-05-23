/**
 * infoとtypeから依存関係エッジの一意キーを生成
 */
export function createDependencyKey(info, type) {
    return `${info.pattern}@${type}`;
}
const cache = {};
;
/**
 * 依存関係エッジ（IDependencyEdge）を生成・キャッシュして返す
 */
export function createDependencyEdge(info, type) {
    const key = createDependencyKey(info, type);
    return cache[key] ?? (cache[key] = { info, type });
}
