import { resolveNodeFromPath } from "../BindingBuilder/resolveNodeFromPath.js";
import { getTemplateById } from "../Template/registerTemplate.js";
import { raiseError } from "../utils.js";
import { createBinding } from "./Binding.js";
import { createLoopContext } from "../LoopContext/createLoopContext.js";
import { getDataBindAttributesById } from "../BindingBuilder/registerDataBindAttributes.js";
import { hasLazyLoadComponents, loadLazyLoadComponent } from "../WebComponents/loadFromImportMap.js";
/**
 * 指定テンプレートIDから DocumentFragment を生成するヘルパー。
 *
 * Params:
 * - id: 登録済みテンプレートID
 *
 * Returns:
 * - テンプレート内容を複製した DocumentFragment
 *
 * Throws:
 * - BIND-101 Template not found: 未登録IDが指定された場合
 */
function createContent(id) {
    const template = getTemplateById(id) ??
        raiseError({
            code: "BIND-101",
            message: `Template not found: ${id}`,
            context: { where: 'BindContent.createContent', templateId: id },
            docsUrl: "./docs/error-codes.md#bind",
        });
    const fragment = document.importNode(template.content, true);
    if (hasLazyLoadComponents()) {
        const lazyLoadElements = fragment.querySelectorAll(":not(:defined)");
        for (let i = 0; i < lazyLoadElements.length; i++) {
            const tagName = lazyLoadElements[i].tagName.toLowerCase();
            loadLazyLoadComponent(tagName);
        }
    }
    return fragment;
}
/**
 * テンプレート内の data-bind 情報から IBinding 配列を構築する。
 *
 * Params:
 * - bindContent: 親 BindContent
 * - id: テンプレートID
 * - engine: コンポーネントエンジン
 * - content: テンプレートから複製したフラグメント
 *
 * Returns:
 * - 生成された IBinding の配列
 *
 * Throws:
 * - BIND-101 Data-bind is not set: テンプレートに data-bind 情報が未登録
 * - BIND-102 Node not found: パスで指すノードが見つからない
 * - BIND-103 Creator not found: 対応する BindingCreator が未登録
 */
function createBindings(bindContent, id, engine, content) {
    const attributes = getDataBindAttributesById(id) ??
        raiseError({
            code: "BIND-101",
            message: "Data-bind is not set",
            context: { where: 'BindContent.createBindings', templateId: id },
            docsUrl: "./docs/error-codes.md#bind",
        });
    const bindings = [];
    for (let i = 0; i < attributes.length; i++) {
        const attribute = attributes[i];
        const node = resolveNodeFromPath(content, attribute.nodePath) ??
            raiseError({
                code: "BIND-102",
                message: `Node not found: ${attribute.nodePath}`,
                context: { where: 'BindContent.createBindings', templateId: id, nodePath: attribute.nodePath },
                docsUrl: "./docs/error-codes.md#bind",
            });
        for (let j = 0; j < attribute.bindTexts.length; j++) {
            const bindText = attribute.bindTexts[j];
            const creator = attribute.creatorByText.get(bindText) ??
                raiseError({
                    code: "BIND-103",
                    message: `Creator not found: ${bindText}`,
                    context: { where: 'BindContent.createBindings', templateId: id, bindText },
                    docsUrl: "./docs/error-codes.md#bind",
                });
            const binding = createBinding(bindContent, node, engine, creator.createBindingNode, creator.createBindingState);
            bindings.push(binding);
        }
    }
    return bindings;
}
/**
 * BindContent は、テンプレートから生成された DOM 断片（DocumentFragment）と
 * そのバインディング情報（IBinding[]）を管理する実装です。
 *
 * 主な役割:
 * - テンプレートIDから DOM 断片を生成し、バインディング情報を構築
 * - mount/mountBefore/mountAfter/unmount で DOM への挿入・削除を制御
 * - applyChange で各 IBinding に更新を委譲
 * - ループ時の LoopContext やリストインデックス管理にも対応
 * - getLastNode で再帰的に最後のノードを取得
 * - assignListIndex でループ内のリストインデックスを再割り当て
 *
 * Throws（代表例）:
 * - BIND-101 Template not found: createContent 内で未登録テンプレートID
 * - BIND-101/102/103: createBindings 内の data-bind 情報不足/不整合
 * - BIND-104 Child bindContent not found: getLastNode の子探索で不整合
 * - BIND-201 LoopContext is null: assignListIndex 実行時に LoopContext 未初期化
 */
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
        if (typeof lastBinding !== "undefined" && lastBinding.node === lastChildNode) {
            if (lastBinding.bindContents.length > 0) {
                const childBindContent = lastBinding.bindContents.at(-1) ?? raiseError({
                    code: "BIND-104",
                    message: "Child bindContent not found",
                    context: { where: 'BindContent.getLastNode', templateId: this.#id },
                    docsUrl: "./docs/error-codes.md#bind",
                });
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
    constructor(parentBinding, id, engine, loopRef) {
        this.parentBinding = parentBinding;
        this.#id = id;
        this.fragment = createContent(id);
        this.childNodes = Array.from(this.fragment.childNodes);
        this.engine = engine;
        this.loopContext = (loopRef.listIndex !== null) ? createLoopContext(loopRef, this) : null;
        this.bindings = createBindings(this, id, engine, this.fragment);
    }
    mount(parentNode) {
        for (let i = 0; i < this.childNodes.length; i++) {
            parentNode.appendChild(this.childNodes[i]);
        }
    }
    mountBefore(parentNode, beforeNode) {
        for (let i = 0; i < this.childNodes.length; i++) {
            parentNode.insertBefore(this.childNodes[i], beforeNode);
        }
    }
    mountAfter(parentNode, afterNode) {
        const beforeNode = afterNode?.nextSibling ?? null;
        for (let i = 0; i < this.childNodes.length; i++) {
            parentNode.insertBefore(this.childNodes[i], beforeNode);
        }
    }
    unmount() {
        // コメント/テキストノードでも確実に取得できるよう parentNode を使用する
        const parentNode = this.childNodes[0]?.parentNode ?? null;
        if (parentNode === null) {
            return; // すでにDOMから削除されている場合は何もしない
        }
        for (let i = 0; i < this.childNodes.length; i++) {
            parentNode.removeChild(this.childNodes[i]);
        }
    }
    bindings = [];
    init() {
        for (let i = 0; i < this.bindings.length; i++) {
            this.bindings[i].init();
        }
    }
    assignListIndex(listIndex) {
        if (this.loopContext == null)
            raiseError({
                code: "BIND-201",
                message: "LoopContext is null",
                context: { where: 'BindContent.assignListIndex', templateId: this.#id },
                docsUrl: "./docs/error-codes.md#bind",
            });
        this.loopContext.assignListIndex(listIndex);
        this.init();
    }
    applyChange(renderer) {
        for (let i = 0; i < this.bindings.length; i++) {
            const binding = this.bindings[i];
            if (renderer.updatedBindings.has(binding))
                continue;
            binding.applyChange(renderer);
        }
    }
}
/**
 * BindContent を生成して初期化（bindings.init）までを行うファクトリ関数。
 *
 * Params:
 * - parentBinding: 親の IBinding（なければ null）
 * - id: テンプレートID
 * - engine: コンポーネントエンジン
 * - loopRef: ループ用の StatePropertyRef（listIndex を含む場合に LoopContext を構築）
 *
 * Returns:
 * - 初期化済みの IBindContent
 */
export function createBindContent(parentBinding, id, engine, loopRef) {
    const bindContent = new BindContent(parentBinding, id, engine, loopRef);
    bindContent.init();
    return bindContent;
}
