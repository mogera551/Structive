import { NodeType } from "./types";

const DEFAULT_PROPERTY = "textContent";

type DefaultPropertyByElementType = {
  [key:string]: string;
}

const defaultPropertyByElementType:DefaultPropertyByElementType = {
  "radio"   : "checked",
  "checkbox": "checked",
  "button"  : "onclick",
}

/**
 * HTML要素のデフォルトプロパティを取得
 */
const getDefaultPropertyHTMLElement = (node:Node):string => 
  node instanceof HTMLSelectElement || node instanceof HTMLTextAreaElement || node instanceof HTMLOptionElement ? "value" : 
  node instanceof HTMLButtonElement ? "onclick" : 
  node instanceof HTMLAnchorElement ? "onclick" : 
  node instanceof HTMLFormElement ? "onsubmit" : 
  node instanceof HTMLInputElement ? (defaultPropertyByElementType[node.type] ?? "value") :
  DEFAULT_PROPERTY;

type DefaultPropertyByKey = {
  [key:string]: string | undefined;
}

const _cache: DefaultPropertyByKey = {};

const textContentProperty = (node:Node):string => DEFAULT_PROPERTY;

type GetDefaultPropertyByNodeType = {
  [key in NodeType]: ((node:Node)=>string) | undefined;
}

const getDefaultPropertyByNodeType: GetDefaultPropertyByNodeType = {
  HTMLElement: getDefaultPropertyHTMLElement,
  SVGElement : undefined,
  Text       : textContentProperty,
  Template   : undefined,
}

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
export function getDefaultName(
  node    : Node, 
  nodeType: NodeType
): string | undefined {
  const key = node.constructor.name + "\t" + ((node as HTMLInputElement).type ?? ""); // type attribute
  return _cache[key] ?? (_cache[key] = getDefaultPropertyByNodeType[nodeType]?.(node));
}
  