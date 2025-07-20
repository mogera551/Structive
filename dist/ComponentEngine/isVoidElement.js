const voidElements = new Set([
    "area", "base", "br", "col", "embed", "hr",
    "img", "input", "link", "meta", "source", "track", "wbr"
]);
export function isVoidElement(tagName) {
    // タグ名を小文字に変換して、void要素のセットに存在するかを確認
    return voidElements.has(tagName.toLowerCase());
}
