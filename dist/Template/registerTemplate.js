import { registerDataBindAttributes } from "../BindingBuilder/registerDataBindAttributes";
import { raiseError } from "../utils";
import { removeEmptyTextNodes } from "./removeEmptyTextNodes";
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
