import { replaceMustacheWithTemplateTag } from "./replaceMustacheWithTemplateTag.js";
import { replaceTemplateTagWithComment } from "./replaceTemplateTagWithComment.js";

export function registerHtml(id: number, html:string) {
  const template = document.createElement("template");
  template.dataset.id = id.toString();
  template.innerHTML = replaceMustacheWithTemplateTag(html);
  replaceTemplateTagWithComment(id, template);
}