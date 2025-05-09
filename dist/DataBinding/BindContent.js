import { resolveNodeFromPath } from "../BindingBuilder/resolveNodeFromPath.js";
import { getTemplateById } from "../Template/registerTemplate.js";
import { raiseError } from "../utils.js";
import { createBinding } from "./Binding.js";
import { createLoopContext } from "../LoopContext/createLoopContext.js";
import { render } from "../Render/render.js";
import { getDataBindAttributesById } from "../BindingBuilder/registerDataBindAttributes.js";
function createContent(id) {
    const template = getTemplateById(id) ??
        raiseError(`BindContent: template is not found: ${id}`);
    return document.importNode(template.content, true);
}
function createBindings(bindContent, id, engine, content) {
    const attributes = getDataBindAttributesById(id) ??
        raiseError(`BindContent: data-bind is not set`);
    const bindings = [];
    for (let i = 0; i < attributes.length; i++) {
        const attribute = attributes[i];
        const node = resolveNodeFromPath(content, attribute.nodePath) ??
            raiseError(`BindContent: node is not found: ${attribute.nodePath}`);
        for (let j = 0; j < attribute.bindTexts.length; j++) {
            const bindText = attribute.bindTexts[j];
            const creator = attribute.creatorByText.get(bindText) ??
                raiseError(`BindContent: creator is not found: ${bindText}`);
            const binding = createBinding(bindContent, node, engine, creator.createBindingNode, creator.createBindingState);
            bindings.push(binding);
        }
    }
    return bindings;
}
class BindContent {
    loopContext;
    parentBinding;
    childNodes;
    fragment;
    engine;
    #id;
    get id() {
        return this.#id;
    }
    get isMounted() {
        return this.childNodes.length > 0 && this.childNodes[0].parentNode !== this.fragment;
    }
    get firstChildNode() {
        return this.childNodes[0] ?? null;
    }
    get lastChildNode() {
        return this.childNodes[this.childNodes.length - 1] ?? null;
    }
    getLastNode(parentNode) {
        const lastBinding = this.bindings[this.bindings.length - 1];
        const lastChildNode = this.lastChildNode;
        if (lastBinding.node === lastChildNode) {
            if (lastBinding.bindContents.size > 0) {
                const childBindContent = Array.from(lastBinding.bindContents).at(-1) ?? raiseError(`BindContent: childBindContent is not found`);
                const lastNode = childBindContent.getLastNode(parentNode);
                if (lastNode !== null) {
                    return lastNode;
                }
            }
        }
        if (parentNode !== lastChildNode?.parentNode) {
            return null;
        }
        return lastChildNode;
    }
    #currentLoopContext;
    get currentLoopContext() {
        if (typeof this.#currentLoopContext === "undefined") {
            let bindContent = this;
            while (bindContent !== null) {
                if (bindContent.loopContext !== null)
                    break;
                ;
                bindContent = bindContent.parentBinding?.parentBindContent ?? null;
            }
            this.#currentLoopContext = bindContent?.loopContext ?? null;
        }
        return this.#currentLoopContext;
    }
    constructor(parentBinding, id, engine, loopContext, listIndex) {
        this.parentBinding = parentBinding;
        this.#id = id;
        this.fragment = createContent(id);
        this.childNodes = Array.from(this.fragment.childNodes);
        this.engine = engine;
        this.loopContext = (listIndex !== null) ? createLoopContext(loopContext, listIndex, this) : null;
        this.bindings = createBindings(this, id, engine, this.fragment);
    }
    mount(parentNode) {
        if (this.fragment.childNodes.length === 0) {
            for (let i = 0; i < this.childNodes.length; i++) {
                this.fragment.appendChild(this.childNodes[i]);
            }
        }
        parentNode.appendChild(this.fragment);
    }
    mountBefore(parentNode, beforeNode) {
        if (this.fragment.childNodes.length === 0) {
            for (let i = 0; i < this.childNodes.length; i++) {
                this.fragment.appendChild(this.childNodes[i]);
            }
        }
        parentNode.insertBefore(this.fragment, beforeNode);
    }
    mountAfter(parentNode, afterNode) {
        if (this.fragment.childNodes.length === 0) {
            for (let i = 0; i < this.childNodes.length; i++) {
                this.fragment.appendChild(this.childNodes[i]);
            }
        }
        parentNode.insertBefore(this.fragment, afterNode?.nextSibling ?? null);
    }
    unmount() {
        for (let i = 0; i < this.childNodes.length; i++) {
            this.fragment.appendChild(this.childNodes[i]);
        }
    }
    bindings = [];
    render() {
        render(this.bindings);
    }
    init() {
        this.bindings.forEach(binding => binding.init());
    }
    assignListIndex(listIndex) {
        if (this.loopContext == null)
            raiseError(`BindContent: loopContext is null`);
        this.loopContext.assignListIndex(listIndex);
        this.init();
    }
}
export function createBindContent(parentBinding, id, engine, loopContext, listIndex) {
    const bindContent = new BindContent(parentBinding, id, engine, loopContext, listIndex);
    bindContent.init();
    return bindContent;
}
