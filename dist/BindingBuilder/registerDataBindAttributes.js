import { createDataBindAttributes } from "./createDataBindAttributes.js";
import { getNodesHavingDataBind } from "./getNodesHavingDataBind.js";
const listDataBindAttributesById = {};
const listPathsSetById = {};
const pathsSetById = {};
/**
 * テンプレートの DocumentFragment から data-bind 対象ノードを抽出し、
 * IDataBindAttributes の配列へ変換するユーティリティ。
 */
function getDataBindAttributesFromTemplate(content) {
    const nodes = getNodesHavingDataBind(content);
    return nodes.map(node => createDataBindAttributes(node));
}
/**
 * テンプレート内のバインディング情報（data-bind 属性やコメント）を解析・登録し、
 * テンプレート ID ごとに属性リストと状態パス集合をキャッシュする。
 *
 * - getNodesHavingDataBind → createDataBindAttributes の順で解析
 * - for バインディングの stateProperty は listPaths にも登録
 *
 * @param id      テンプレート ID
 * @param content テンプレートの DocumentFragment
 * @param rootId  ルートテンプレート ID（省略時は id と同じ）
 * @returns       解析済みバインディング属性リスト
 */
export function registerDataBindAttributes(id, content, rootId = id) {
    const dataBindAttributes = getDataBindAttributesFromTemplate(content);
    const paths = pathsSetById[rootId] ?? (pathsSetById[rootId] = new Set());
    const listPaths = listPathsSetById[rootId] ?? (listPathsSetById[rootId] = new Set());
    for (let i = 0; i < dataBindAttributes.length; i++) {
        const attribute = dataBindAttributes[i];
        for (let j = 0; j < attribute.bindTexts.length; j++) {
            const bindText = attribute.bindTexts[j];
            paths.add(bindText.stateProperty);
            if (bindText.nodeProperty === "for") {
                listPaths.add(bindText.stateProperty);
            }
        }
    }
    return listDataBindAttributesById[id] = dataBindAttributes;
}
/** テンプレート ID からバインディング属性リストを取得 */
export const getDataBindAttributesById = (id) => {
    return listDataBindAttributesById[id];
};
/** テンプレート ID から for バインディングの stateProperty 集合を取得 */
export const getListPathsSetById = (id) => {
    return listPathsSetById[id] ?? [];
};
/** テンプレート ID から全バインディングの stateProperty 集合を取得 */
export const getPathsSetById = (id) => {
    return pathsSetById[id] ?? [];
};
