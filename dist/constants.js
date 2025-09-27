export const DATA_BIND_ATTRIBUTE = "data-bind";
export const COMMENT_EMBED_MARK = "@@:"; // 埋め込み変数のマーク
export const COMMENT_TEMPLATE_MARK = "@@|"; // テンプレートのマーク
export const MAX_WILDCARD_DEPTH = 32; // ワイルドカードの最大深度
export const WILDCARD = "*"; // ワイルドカード
export const RESERVED_WORD_SET = new Set([
    "constructor", "prototype", "__proto__", "toString",
    "valueOf", "hasOwnProperty", "isPrototypeOf",
    "watch", "unwatch", "eval", "arguments",
    "let", "var", "const", "class", "function",
    "null", "true", "false", "new", "return",
]);
