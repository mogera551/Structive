import { DATA_BIND_ATTRIBUTE, COMMENT_EMBED_MARK, COMMENT_TEMPLATE_MARK } from "../constants.js";

/**
 * "@@:"もしくは"@@|"で始まるコメントノードを取得する
 */
function isCommentNode(node: Node): boolean {
  return node instanceof Comment && (
    (node.textContent?.indexOf(COMMENT_EMBED_MARK) === 0) || (node.textContent?.indexOf(COMMENT_TEMPLATE_MARK) === 0)
  );
} 

/**
 * 指定ノード以下のツリーから「data-bind属性を持つ要素」または
 * 「特定のマーク（@@: または @@|）で始まるコメントノード」をすべて取得するユーティリティ関数。
 *
 * - Elementノードの場合: data-bind属性があるものだけを抽出
 * - Commentノードの場合: COMMENT_EMBED_MARK または COMMENT_TEMPLATE_MARK で始まるものだけを抽出
 * - DOMツリー全体をTreeWalkerで効率的に走査
 *
 * @param root 探索の起点となるノード
 * @returns    条件に合致したノードの配列
 */
export function getNodesHavingDataBind(root: Node): Node[] {
  const nodes: Node[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT, {
    acceptNode(node:Node) {
      return (node instanceof Element) ? 
        (node.hasAttribute(DATA_BIND_ATTRIBUTE) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP)
        : (isCommentNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP);
    }
  });
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }
  return nodes;
}

