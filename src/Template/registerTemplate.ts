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
  return templateById[id] ?? raiseError(`getTemplateById: template not found: ${id}`);
}