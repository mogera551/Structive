const trim = (s) => s.trim();
const has = (s) => s.length > 0; // check length
const re = new RegExp(/^#(.*)#$/);
const decode = (s) => {
    const m = re.exec(s);
    return m ? decodeURIComponent(m[1]) : s;
};
/**
 * parse filter part
 * "eq,100|falsey" ---> [Filter(eq, [100]), Filter(falsey)]
 */
const parseFilter = (text) => {
    const [name, ...options] = text.split(",").map(trim);
    return { name, options: options.map(decode) };
};
/**
 * parse expression
 * "value|eq,100|falsey" ---> ["value", Filter[]]
 */
const parseProperty = (text) => {
    const [property, ...filterTexts] = text.split("|").map(trim);
    return { property, filters: filterTexts.map(parseFilter) };
};
/**
 * parse expressions
 * "textContent:value|eq,100|falsey" ---> ["textContent", "value", Filter[eq, falsey]]
 */
const parseExpression = (expression) => {
    const [bindExpression, decoratesExpression = null] = expression.split("@").map(trim);
    const decorates = decoratesExpression ? decoratesExpression.split(",").map(trim) : [];
    const [nodePropertyText, statePropertyText] = bindExpression.split(":").map(trim);
    const { property: nodeProperty, filters: inputFilterTexts } = parseProperty(nodePropertyText);
    const { property: stateProperty, filters: outputFilterTexts } = parseProperty(statePropertyText);
    return { nodeProperty, stateProperty, inputFilterTexts, outputFilterTexts, decorates };
};
/**
 * parse bind text and return BindText[]
 */
const parseExpressions = (text) => {
    return text.split(";").map(trim).filter(has).map(s => parseExpression(s));
};
const cache = {};
/**
 * 取得したバインドテキスト(getBindTextByNodeType)を解析して、バインド情報を取得する
 * @param text バインドテキスト
 * @param defaultName デフォルト名
 * @returns {IBindText[]} バインド情報
 */
export function parseBindText(text) {
    if (text.trim() === "") {
        return [];
    }
    return cache[text] ?? (cache[text] = parseExpressions(text));
}
