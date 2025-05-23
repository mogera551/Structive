import { IFilterText, IBindText } from "./types";

const trim = (s:string):string => s.trim();

const has = (s:string):boolean => s.length > 0; // check length

const re = new RegExp(/^#(.*)#$/);
const decode = (s:string):string => {
  const m = re.exec(s);
  return m ? decodeURIComponent(m[1]) : s;
};

/**
 * parse filter part
 * "eq,100|falsey" ---> [Filter(eq, [100]), Filter(falsey)]
 */
const parseFilter = (text:string): IFilterText => {
  const [name, ...options] = text.split(",").map(trim);
  return {name, options:options.map(decode)};
};

type ReturnParseStateProperty = {property:string,filters:IFilterText[]};
/**
 * parse expression
 * "value|eq,100|falsey" ---> ["value", Filter[]]
 */
const parseProperty = (text:string): ReturnParseStateProperty => {
  const [property, ...filterTexts] = text.split("|").map(trim);
  return {property, filters:filterTexts.map(parseFilter)};
};

/**
 * parse expressions
 * "textContent:value|eq,100|falsey" ---> ["textContent", "value", Filter[eq, falsey]]
 */
const parseExpression = (expression:string): IBindText => {
  const [ bindExpression, decoratesExpression = null ] = expression.split("@").map(trim);
  const decorates = decoratesExpression ? decoratesExpression.split(",").map(trim) : [];
  const [nodePropertyText, statePropertyText] = bindExpression.split(":").map(trim);
  const { property:nodeProperty, filters:inputFilterTexts } = parseProperty(nodePropertyText);
  const { property:stateProperty, filters:outputFilterTexts } = parseProperty(statePropertyText);
  return { nodeProperty, stateProperty, inputFilterTexts, outputFilterTexts, decorates };
};

/**
 * parse bind text and return BindText[]
 */
const parseExpressions = (text:string): IBindText[] => {
  return text.split(";").map(trim).filter(has).map(s => parseExpression(s));
};

const cache:{[key:string]: IBindText[]} = {};

/**
 * バインドテキスト（data-bind属性やコメント等から取得した文字列）を解析し、
 * バインディング情報（IBindText[]）に変換するユーティリティ関数群。
 *
 * - フィルターやデコレータ、プロパティ名などをパースし、構造化データとして返す
 * - "textContent:value|eq,100|falsey@decorate1,decorate2" のような複雑な記法にも対応
 * - セミコロン区切りで複数バインドもサポート
 * - パース結果はキャッシュし、同じ入力の再解析を防止
 *
 * @param text バインドテキスト
 * @returns    解析済みバインディング情報（IBindText[]）
 */
export function parseBindText(
  text: string
): IBindText[] {
  if (text.trim() === "") {
    return [];
  }
  return cache[text] ?? (cache[text] = parseExpressions(text));
}
