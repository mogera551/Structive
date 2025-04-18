import { replaceMustacheWithTemplateTag } from "./replaceMustacheWithTemplateTag";
import { replaceTemplateTagWithComment } from "./replaceTemplateTagWithComment";

export function registerHtml(id: number, html:string) {
  const template = document.createElement("template");
  template.dataset.id = id.toString();
  template.innerHTML = replaceMustacheWithTemplateTag(html);
  replaceTemplateTagWithComment(id, template);
}