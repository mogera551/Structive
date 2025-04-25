import { COMMENT_EMBED_MARK, COMMENT_TEMPLATE_MARK, DATA_BIND_ATTRIBUTE } from "../constants.js";
import { getTemplateById } from "../Template/registerTemplate.js";
import { raiseError } from "../utils.js";
const COMMENT_EMBED_MARK_LEN = COMMENT_EMBED_MARK.length;
const COMMENT_TEMPLATE_MARK_LEN = COMMENT_TEMPLATE_MARK.length;
const getTextFromContent = (node) => node.textContent?.slice(COMMENT_EMBED_MARK_LEN).trim() ?? "";
const getTextFromAttribute = (node) => node.getAttribute(DATA_BIND_ATTRIBUTE) ?? "";
const getTextFromTemplate = (node) => {
    const text = node.textContent?.slice(COMMENT_TEMPLATE_MARK_LEN).trim();
    const id = Number(text);
    const template = getTemplateById(id) ?? raiseError(`Template not found: ${text}`);
    return template.getAttribute(DATA_BIND_ATTRIBUTE) ?? "";
};
const getTextFromSVGElement = (node) => node.getAttribute(DATA_BIND_ATTRIBUTE) ?? "";
const getTextByNodeType = {
    "Text": getTextFromContent,
    "HTMLElement": getTextFromAttribute,
    "Template": getTextFromTemplate,
    "SVGElement": getTextFromSVGElement
};
export function getDataBindText(nodeType, node) {
    const bindText = getTextByNodeType[nodeType](node) ?? "";
    if (nodeType === "Text") {
        return "textContent:" + bindText;
    }
    else {
        return bindText;
    }
}
