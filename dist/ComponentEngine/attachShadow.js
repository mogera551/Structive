import { raiseError } from "../utils.js";
import { canHaveShadowRoot } from "./canHaveShadowRoot.js";
function getParentShadowRoot(parentNode) {
    let node = parentNode;
    while (node) {
        if (node instanceof ShadowRoot) {
            return node;
        }
        node = node.parentNode;
    }
}
/**
 * 指定したHTMLElementにShadow DOMをアタッチし、スタイルシートを適用するユーティリティ関数。
 *
 * - config.enableShadowDomがtrueの場合は、ShadowRootを生成し、adoptedStyleSheetsでスタイルを適用
 * - extends指定がある場合はcanHaveShadowRootで拡張可能かチェック
 * - Shadow DOMを使わない場合は、親のShadowRootまたはdocumentにスタイルシートを追加
 * - すでに同じスタイルシートが含まれていれば重複追加しない
 *
 * @param element    対象のHTMLElement
 * @param config     コンポーネント設定
 * @param styleSheet 適用するCSSStyleSheet
 * @throws           Shadow DOM非対応の組み込み要素を拡張しようとした場合はエラー
 */
export function attachShadow(element, config, styleSheet) {
    if (config.enableShadowDom) {
        if (config.extends === null || canHaveShadowRoot(config.extends)) {
            if (!element.shadowRoot) {
                const shadowRoot = element.attachShadow({ mode: 'open' });
                shadowRoot.adoptedStyleSheets = [styleSheet];
            }
        }
        else {
            raiseError(`ComponentEngine: Shadow DOM not supported for builtin components that extend ${config.extends}`);
        }
    }
    else {
        const shadowRootOrDocument = getParentShadowRoot(element.parentNode) || document;
        const styleSheets = shadowRootOrDocument.adoptedStyleSheets;
        if (!styleSheets.includes(styleSheet)) {
            shadowRootOrDocument.adoptedStyleSheets = [...styleSheets, styleSheet];
        }
    }
}
