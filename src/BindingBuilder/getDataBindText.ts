import { COMMENT_EMBED_MARK, COMMENT_TEMPLATE_MARK, DATA_BIND_ATTRIBUTE } from "../constants.js";
import { getTemplateById } from "../Template/registerTemplate.js";
import { raiseError } from "../utils.js";
import { NodeType } from "./types";

const COMMENT_EMBED_MARK_LEN = COMMENT_EMBED_MARK.length;
const COMMENT_TEMPLATE_MARK_LEN = COMMENT_TEMPLATE_MARK.length;

const getTextFromContent   = (node:Node):string        => node.textContent?.slice(COMMENT_EMBED_MARK_LEN).trim() ?? "";
const getTextFromAttribute = (node:HTMLElement):string => node.getAttribute(DATA_BIND_ATTRIBUTE) ?? "";
const getTextFromTemplate  = (node:Node):string        => {
  const text = node.textContent?.slice(COMMENT_TEMPLATE_MARK_LEN).trim(); 
  const id = Number(text);
  const template = getTemplateById(id) ?? raiseError(`Template not found: ${text}`);
  return template.getAttribute(DATA_BIND_ATTRIBUTE) ?? "";
};
const getTextFromSVGElement = (node:SVGElement):string => node.getAttribute(DATA_BIND_ATTRIBUTE) ?? "";

const getTextByNodeType = {
  "Text":        getTextFromContent,
  "HTMLElement": getTextFromAttribute,
  "Template":    getTextFromTemplate,
  "SVGElement":  getTextFromSVGElement
};

/**
 * ノード種別ごとにdata-bindテキスト（バインディング定義文字列）を取得するユーティリティ関数。
 *
 * - Textノード: コメントマーク以降のテキストを取得し、"textContent:"を付与
 * - HTMLElement: data-bind属性値を取得
 * - Templateノード: コメントマーク以降のIDからテンプレートを取得し、そのdata-bind属性値を取得
 * - SVGElement: data-bind属性値を取得
 *
 * @param nodeType ノード種別（"Text" | "HTMLElement" | "Template" | "SVGElement"）
 * @param node     対象ノード
 * @returns        バインディング定義文字列
 */
export function getDataBindText(nodeType: NodeType, node: Node): string {
  const bindText = getTextByNodeType[nodeType](node as any) ?? "";
  if (nodeType === "Text") {
    // Textノードの場合は"textContent:"を付与
    return "textContent:" + bindText;
  } else {
    return bindText;
  }
}
