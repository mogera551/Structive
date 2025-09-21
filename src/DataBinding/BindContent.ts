import { resolveNodeFromPath } from "../BindingBuilder/resolveNodeFromPath.js";
import { ILoopContext } from "../LoopContext/types";
import { IComponentEngine } from "../ComponentEngine/types";
import { getTemplateById } from "../Template/registerTemplate.js";
import { raiseError } from "../utils.js";
import { createBinding } from "./Binding.js";
import { IBindContent, IBinding } from "./types";
import { createLoopContext } from "../LoopContext/createLoopContext.js";
import { getDataBindAttributesById } from "../BindingBuilder/registerDataBindAttributes.js";
import { hasLazyLoadComponents, loadLazyLoadComponent } from "../WebComponents/loadFromImportMap.js";
import { IListIndex } from "../ListIndex/types.js";
import { IRenderer } from "../Updater/types.js";

function createContent(id: number): DocumentFragment {
  const template = getTemplateById(id) ?? 
    raiseError(`BindContent: template is not found: ${id}`);
  const fragment = document.importNode(template.content, true);
  if (hasLazyLoadComponents()) {
    const lazyLoadElements = fragment.querySelectorAll(":not(:defined)");
    for(let i = 0; i < lazyLoadElements.length; i++) {
      const tagName = lazyLoadElements[i].tagName.toLowerCase();
      loadLazyLoadComponent(tagName);
    }
  }
  return fragment;
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

/**
 * BindContentクラスは、テンプレートから生成されたDOM断片（DocumentFragment）と
 * そのバインディング情報（IBinding配列）を管理するための実装です。
 *
 * 主な役割:
 * - テンプレートIDからDOM断片を生成し、バインディング情報を構築
 * - mount/mountBefore/mountAfter/unmountでDOMへの挿入・削除を制御
 * - renderでバインディングの再描画、initで初期化処理を実行
 * - ループバインディング時のLoopContextやリストインデックス管理にも対応
 * - getLastNodeで再帰的に最後のノードを取得し、リスト描画や差し替えに利用
 * - assignListIndexでループ内のリストインデックスを再割り当てし、再初期化
 *
 * 設計ポイント:
 * - fragmentとchildNodesの両方を管理し、効率的なDOM操作を実現
 * - バインディング情報はテンプレートごとに動的に生成され、各ノードに紐付く
 * - ループや条件分岐など複雑なバインディング構造にも柔軟に対応
 * - createBindContentファクトリ関数で一貫した生成・初期化を提供
 */
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
    if (typeof lastBinding !== "undefined" && lastBinding.node === lastChildNode) {
      if (lastBinding.bindContents.length > 0) {
        const childBindContent = lastBinding.bindContents.at(-1) ?? raiseError(`BindContent: childBindContent is not found`);
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
    for(let i = 0; i < this.childNodes.length; i++) {
      parentNode.appendChild(this.childNodes[i]);
    }
  }
  mountBefore(parentNode: Node, beforeNode: Node | null) {
    for(let i = 0; i < this.childNodes.length; i++) {
      parentNode.insertBefore(this.childNodes[i], beforeNode);
    }
  }
  mountAfter(parentNode: Node, afterNode: Node | null) {
    const beforeNode = afterNode?.nextSibling ?? null;
    for(let i = 0; i < this.childNodes.length; i++) {
      parentNode.insertBefore(this.childNodes[i], beforeNode);
    }
  }
  unmount() {
    const parentElement = this.childNodes[0]?.parentElement ?? null;
    if (parentElement === null) {
      return; // すでにDOMから削除されている場合は何もしない
    }
    for(let i = 0; i < this.childNodes.length; i++) {
      parentElement.removeChild(this.childNodes[i]);
    }
  }
  bindings: IBinding[] = [];
  init() {
    for(let i = 0; i < this.bindings.length; i++) {
      this.bindings[i].init();
    }
  }
  assignListIndex(listIndex: IListIndex): void {
    if (this.loopContext == null) raiseError(`BindContent: loopContext is null`);
    this.loopContext.assignListIndex(listIndex);
    this.init();
  }
  applyChange(renderer: IRenderer): void {
    for(let i = 0; i < this.bindings.length; i++) {
      const binding = this.bindings[i];
      if (renderer.updatedBindings.has(binding)) continue;
      binding.applyChange(renderer);
    }
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