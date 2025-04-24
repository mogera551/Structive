import { COMMENT_TEMPLATE_MARK, DATA_BIND_ATTRIBUTE } from "../constants";
import { generateId } from "../GlobalId/generateId";
import { registerTemplate } from "./registerTemplate";
const SVG_NS = "http://www.w3.org/2000/svg";
export function replaceTemplateTagWithComment(id, template, rootId = id) {
    // テンプレートの親ノードが存在する場合は、テンプレートをコメントノードに置き換える
    template.parentNode?.replaceChild(document.createComment(`${COMMENT_TEMPLATE_MARK}${id}`), template);
    if (template.namespaceURI === SVG_NS) {
        // SVGタグ内のtemplateタグを想定
        const newTemplate = document.createElement("template");
        for (let childNode of Array.from(template.childNodes)) {
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
