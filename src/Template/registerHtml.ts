/**
 * registerHtml.ts
 *
 * HTML文字列をテンプレートとして登録するユーティリティ関数です。
 *
 * 主な役割:
 * - 指定IDでHTMLテンプレートを生成し、data-id属性を付与
 * - Mustache構文（{{ }})をテンプレートタグに変換（replaceMustacheWithTemplateTagを利用）
 * - テンプレートタグをコメントに置換（replaceTemplateTagWithCommentを利用）
 *
 * 設計ポイント:
 * - テンプレートの動的生成・管理や、構文変換による柔軟なテンプレート処理に対応
 * - テンプレートはdocument.createElement("template")で生成し、data-idで識別
 */
import { replaceMustacheWithTemplateTag } from "./replaceMustacheWithTemplateTag.js";
import { replaceTemplateTagWithComment } from "./replaceTemplateTagWithComment.js";

export function registerHtml(id: number, html:string) {
  const template = document.createElement("template");
  template.dataset.id = id.toString();
  template.innerHTML = replaceMustacheWithTemplateTag(html);
  replaceTemplateTagWithComment(id, template);
}