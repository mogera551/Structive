/**
 * registerTemplate.ts
 *
 * HTMLTemplateElementをIDで登録・取得するための管理モジュールです。
 *
 * 主な役割:
 * - templateById: IDをキーにHTMLTemplateElementを管理するレコード
 * - registerTemplate: 指定IDでテンプレートを登録し、空テキストノード除去やデータバインド属性の登録も実行
 * - getTemplateById: 指定IDのテンプレートを取得（未登録時はエラーを投げる）
 *
 * 設計ポイント:
 * - テンプレート登録時にremoveEmptyTextNodesで空テキストノードを除去し、クリーンなDOMを維持
 * - registerDataBindAttributesでデータバインド属性を自動付与
 * - グローバルにテンプレートを一元管理し、ID経由で高速にアクセス可能
 * - 存在しないIDアクセス時はraiseErrorで明確な例外を発生
 */
import { registerDataBindAttributes } from "../BindingBuilder/registerDataBindAttributes.js";
import { raiseError } from "../utils.js";
import { removeEmptyTextNodes } from "./removeEmptyTextNodes.js";

const templateById:Record<number, HTMLTemplateElement> = {};

export function registerTemplate(
  id      : number, 
  template: HTMLTemplateElement,
  rootId  : number
): number {
  removeEmptyTextNodes(template.content);
  registerDataBindAttributes(id, template.content, rootId);  
  templateById[id] = template;
  return id;
}

export function getTemplateById(id: number): HTMLTemplateElement {
  return templateById[id] ?? raiseError({
    code: "TMP-001",
    message: `Template not found: ${id}`,
    context: { where: 'registerTemplate.getTemplateById', templateId: id },
    docsUrl: "./docs/error-codes.md#tmp",
  });
}