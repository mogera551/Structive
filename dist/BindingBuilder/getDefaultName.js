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
 * バインド情報でノードプロパティを省略された場合のデフォルトのプロパティ名を取得
 * @param node ノード
 * @param nodeType ノードタイプ
 * @returns {string | undefined} デフォルトのプロパティ名
 */
export function getDefaultName(node, nodeType) {
    const key = node.constructor.name + "\t" + (node.type ?? ""); // type attribute
    return _cache[key] ?? (_cache[key] = getDefaultPropertyByNodeType[nodeType]?.(node));
}
