import { resolveNodeFromPath } from "../BindingBuilder/resolveNodeFromPath";
import { ILoopContext } from "../LoopContext/types";
import { IListIndex } from "../ListIndex/types";
import { IComponentEngine } from "../ComponentEngine/types";
import { getTemplateById } from "../Template/registerTemplate";
import { raiseError } from "../utils";
import { createBinding } from "./Binding";
import { IBindContent, IBinding } from "./types";
import { createLoopContext } from "../LoopContext/createLoopContext";
import { render } from "../Render/render";
import { getDataBindAttributesById } from "../BindingBuilder/registerDataBindAttributes";

function createContent(id: number): DocumentFragment {
  const template = getTemplateById(id) ?? 
    raiseError(`BindContent: template is not found: ${id}`);
  return document.importNode(template.content, true);
}

function createBindings(
  bindContent: IBindContent, 
  id         : number, 
  engine     : IComponentEngine, 
  content    : DocumentFragment
): IBinding[] {
  const attributes = getDataBindAttributesById(id) ?? 
    raiseError(`BindContent: data-bind is not set`);
  const bindings: IBinding[] = [];
  for(let i = 0; i < attributes.length; i++) {
    const attribute = attributes[i];
    const node = resolveNodeFromPath(content, attribute.nodePath) ?? 
      raiseError(`BindContent: node is not found: ${attribute.nodePath}`);
    for(let j = 0; j < attribute.bindTexts.length; j++) {
      const bindText = attribute.bindTexts[j];
      const creator = attribute.creatorByText.get(bindText) ?? 
        raiseError(`BindContent: creator is not found: ${bindText}`);
      const binding = createBinding(
        bindContent, 
        node, 
        engine, 
        creator.createBindingNode, 
        creator.createBindingState
      );
      bindings.push(binding);
    }
  }
  return bindings;
}

class BindContent implements IBindContent {
  loopContext  : ILoopContext | null;
  parentBinding: IBinding | null;
  childNodes   : Node[];
  fragment     : DocumentFragment;
  engine       : IComponentEngine | undefined;
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
  getLastNode(parentNode: Node): Node | null {
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
  #currentLoopContext: ILoopContext | null | undefined;
  get currentLoopContext(): ILoopContext | null {
    if (typeof this.#currentLoopContext === "undefined") {
      let bindContent: IBindContent | null = this;
      while(bindContent !== null) {
        if (bindContent.loopContext !== null) break; ;
        bindContent = bindContent.parentBinding?.parentBindContent ?? null;
      }
      this.#currentLoopContext = bindContent?.loopContext ?? null;
    }
    return this.#currentLoopContext;
  }
  constructor(
    parentBinding: IBinding | null,
    id           : number, 
    engine       : IComponentEngine, 
    loopContext  : string | null,
    listIndex    : IListIndex | null
  ) {
    this.parentBinding = parentBinding;
    this.#id = id;
    this.fragment = createContent(id);
    this.childNodes = Array.from(this.fragment.childNodes);
    this.engine = engine;
    this.loopContext = (listIndex !== null) ? createLoopContext(loopContext, listIndex, this) : null;
    this.bindings = createBindings(
      this, 
      id, 
      engine, 
      this.fragment
    );
  }
  mount(parentNode: Node) {
    parentNode.appendChild(this.fragment);
  }
  mountBefore(parentNode: Node, beforeNode: Node | null) {
    parentNode.insertBefore(this.fragment, beforeNode);
  }
  mountAfter(parentNode: Node, afterNode: Node | null) {
    parentNode.insertBefore(
      this.fragment, 
      afterNode?.nextSibling ?? null
    );
  }
  unmount() {
    for(let i = 0; i < this.childNodes.length; i++) {
      this.fragment.appendChild(this.childNodes[i]);
    }
  }
  bindings: IBinding[] = [];
  render() {
    render(this.bindings);
  }
  init() {
    this.bindings.forEach(binding => binding.init());
  }
  assignListIndex(listIndex: IListIndex): void {
    if (this.loopContext == null) raiseError(`BindContent: loopContext is null`);
    this.loopContext.assignListIndex(listIndex);
    this.init();
  }
}

export function createBindContent(
  parentBinding: IBinding | null,
  id           : number, 
  engine       :IComponentEngine, 
  loopContext  : string | null, 
  listIndex    :IListIndex | null
):IBindContent {
  const bindContent = new BindContent(
    parentBinding, 
    id, 
    engine, 
    loopContext, 
    listIndex
  );
  bindContent.init();
  return bindContent;
}