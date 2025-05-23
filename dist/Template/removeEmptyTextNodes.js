/**
 * removeEmptyTextNodes.ts
 *
 * DocumentFragment内の空テキストノードを削除するユーティリティ関数です。
 *
 * 主な役割:
 * - content（DocumentFragment）の直下にある空白のみのテキストノードを検出し、削除する
 *
 * 設計ポイント:
 * - childNodesをArray.fromで配列化し、forEachで全ノードを走査
 * - nodeTypeがTEXT_NODEかつ、nodeValueが空白のみの場合にremoveChildで削除
 * - テンプレート処理やクリーンなDOM生成時に利用
 */
export function removeEmptyTextNodes(content) {
    Array.from(content.childNodes).forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && !(node.nodeValue ?? "").trim()) {
            content.removeChild(node);
        }
    });
}
