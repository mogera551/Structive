/**
 * 指定ノードの「親からのインデックス」をルートまで辿り、絶対パス（NodePath）として返すユーティリティ関数。
 *
 * 例: ルートから見て [0, 2, 1] のような配列を返す。
 *     これは「親→子→孫…」とたどったときの各階層でのインデックスを表す。
 *
 * @param node 対象のDOMノード
 * @returns    ルートからこのノードまでのインデックス配列（NodePath）
 */
export function getAbsoluteNodePath(node) {
    let routeIndexes = [];
    while (node.parentNode !== null) {
        const childNodes = Array.from(node.parentNode.childNodes);
        routeIndexes = [childNodes.indexOf(node), ...routeIndexes];
        node = node.parentNode;
    }
    return routeIndexes;
}
