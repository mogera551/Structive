import { registerDataBindAttributes } from "../BindingBuilder/registerDataBindAttributes.js";
import { raiseError } from "../utils.js";
import { removeEmptyTextNodes } from "./removeEmptyTextNodes.js";
const templateById = {};
export function registerTemplate(id, template, rootId) {
    removeEmptyTextNodes(template.content);
    registerDataBindAttributes(id, template.content, rootId);
    templateById[id] = template;
    return id;
}
export function getTemplateById(id) {
    return templateById[id] ?? raiseError(`getTemplateById: template not found: ${id}`);
}
