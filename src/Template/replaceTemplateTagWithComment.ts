/**
 * replaceTemplateTagWithComment.ts
 *
 * <template>タグをコメントノードに置換し、テンプレートを再帰的に登録するユーティリティ関数です。
 *
 * 主な役割:
 * - 指定したHTMLTemplateElementをコメントノード（<!--template:id-->）に置換
 * - SVG内のtemplateタグは通常のtemplate要素に変換し、属性や子ノードを引き継ぐ
 * - テンプレート内の入れ子templateも再帰的に置換・登録
 * - registerTemplateでテンプレートをID付きで管理
 *
 * 設計ポイント:
 * - テンプレートの階層構造を維持しつつ、DOM上はコメントノードでマーク
 * - SVG対応や属性引き継ぎなど、汎用的なテンプレート処理に対応
 * - generateIdでユニークIDを割り当て、テンプレート管理を一元化
 */
import { COMMENT_TEMPLATE_MARK, DATA_BIND_ATTRIBUTE } from "../constants.js";
import { generateId } from "../GlobalId/generateId.js";
import { registerTemplate } from "./registerTemplate.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export function replaceTemplateTagWithComment(
  id      : number, 
  template: HTMLTemplateElement,
  rootId  : number = id
):number {
  // テンプレートの親ノードが存在する場合は、テンプレートをコメントノードに置き換える
  template.parentNode?.replaceChild(document.createComment(`${COMMENT_TEMPLATE_MARK}${id}`), template);
  if (template.namespaceURI === SVG_NS) {
    // SVGタグ内のtemplateタグを想定
    const newTemplate = document.createElement("template");
    const childNodes = Array.from(template.childNodes);
    for(let i = 0; i < childNodes.length; i++) {
      const childNode = childNodes[i];
      newTemplate.content.appendChild(childNode);
    }
    const bindText = template.getAttribute(DATA_BIND_ATTRIBUTE);
    newTemplate.setAttribute(DATA_BIND_ATTRIBUTE, bindText ?? "");
    template = newTemplate;
  }
  template.content.querySelectorAll("template").forEach(template => {
    replaceTemplateTagWithComment(generateId(), template, rootId);
  });
  registerTemplate(id, template, rootId);
  return id;
}
