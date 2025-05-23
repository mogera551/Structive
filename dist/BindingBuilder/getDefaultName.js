const DEFAULT_PROPERTY = "textContent";
const defaultPropertyByElementType = {
    "radio": "checked",
    "checkbox": "checked",
    "button": "onclick",
};
/**
 * HTML要素のデフォルトプロパティを取得
 */
const getDefaultPropertyHTMLElement = (node) => node instanceof HTMLSelectElement || node instanceof HTMLTextAreaElement || node instanceof HTMLOptionElement ? "value" :
    node instanceof HTMLButtonElement ? "onclick" :
        node instanceof HTMLAnchorElement ? "onclick" :
            node instanceof HTMLFormElement ? "onsubmit" :
                node instanceof HTMLInputElement ? (defaultPropertyByElementType[node.type] ?? "value") :
                    DEFAULT_PROPERTY;
const _cache = {};
const textContentProperty = (node) => DEFAULT_PROPERTY;
const getDefaultPropertyByNodeType = {
    HTMLElement: getDefaultPropertyHTMLElement,
    SVGElement: undefined,
    Text: textContentProperty,
    Template: undefined,
};
/**
 * バインド情報でノードプロパティが省略された場合に、ノード種別・要素タイプごとに
 * 適切なデフォルトプロパティ名（例: textContent, value, checked, onclick など）を返すユーティリティ関数。
 *
 * - HTMLInputElementやHTMLSelectElementなど、要素ごとに最適なプロパティを判定
 * - input要素はtype属性（radio, checkboxなど）も考慮
 * - 一度判定した組み合わせはキャッシュし、パフォーマンス向上
 *
 * @param node     対象ノード
 * @param nodeType ノードタイプ（"HTMLElement" | "SVGElement" | "Text" | "Template"）
 * @returns        デフォルトのプロパティ名（例: "value", "checked", "textContent" など）
 */
export function getDefaultName(node, nodeType) {
    const key = node.constructor.name + "\t" + (node.type ?? ""); // type attribute
    return _cache[key] ?? (_cache[key] = getDefaultPropertyByNodeType[nodeType]?.(node));
}
