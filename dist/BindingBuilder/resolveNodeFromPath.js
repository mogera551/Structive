/**
 * ルートノードとノードパス（インデックス配列）から、該当するノードを辿って取得するユーティリティ関数。
 *
 * - NodePathは各階層でのchildNodesのインデックスを表す配列
 * - ルートから順にchildNodes[index]を辿り、該当ノードを返す
 * - パスが不正な場合やノードが存在しない場合はnullを返す
 *
 * @param root  探索の起点となるルートノード
 * @param path  各階層のインデックス配列（NodePath）
 * @returns     パスで指定されたノード、またはnull
 */
export function resolveNodeFromPath(root, path) {
    return path.reduce((node, index) => node?.childNodes[index] ?? null, root);
}
