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
    const blockBindings = [];
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
            if (binding.bindingNode.isBlock) {
                blockBindings.push(binding);
            }
            bindings.push(binding);
        }
    }
    return [bindings, blockBindings];
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
    bindings = [];
    blockBindings = [];
    #id;
    get id() {
        return this.#id;
    }
    /**
     * この BindContent が既に DOM にマウントされているかどうか。
     * 判定は childNodes[0] の親が fragment 以外かで行う。
     */
    get isMounted() {
        return this.childNodes.length > 0 && this.childNodes[0].parentNode !== this.fragment;
    }
    /**
     * 先頭の子ノードを返す。存在しなければ null。
     */
    get firstChildNode() {
        return this.childNodes[0] ?? null;
    }
    /**
     * 末尾の子ノードを返す。存在しなければ null。
     */
    get lastChildNode() {
        return this.childNodes[this.childNodes.length - 1] ?? null;
    }
    get hasBlockBinding() {
        return this.blockBindings.length > 0;
    }
    /**
     * 再帰的に最終ノード（末尾のバインディング配下も含む）を取得する。
     *
     * Params:
     * - parentNode: 検証対象の親ノード（このノード配下にあることを期待）
     *
     * Returns:
     * - 最終ノード（Node）または null（親子関係が崩れている場合）
     *
     * Throws:
     * - BIND-104 子 BindContent が見つからない（不整合）
     */
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
    /**
     * 現在のループ文脈（LoopContext）を返す。自身に無ければ親方向へ遡って探索し、
     * 一度解決した値はフィールドにキャッシュする。
     */
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
    /**
     * コンストラクタ。
     * - テンプレートから DocumentFragment と childNodes を構築
     * - ループ参照（loopRef.listIndex）がある場合に LoopContext を生成
     * - テンプレートに基づき Bindings を生成
     */
    constructor(parentBinding, id, engine, loopRef) {
        this.parentBinding = parentBinding;
        this.#id = id;
        this.fragment = createContent(id);
        this.childNodes = Array.from(this.fragment.childNodes);
        this.engine = engine;
        this.loopContext = (loopRef.listIndex !== null) ? createLoopContext(loopRef, this) : null;
        const [bindings, blockBindings] = createBindings(this, id, engine, this.fragment);
        this.bindings = bindings;
        this.blockBindings = blockBindings;
    }
    /**
     * 末尾にマウント（appendChild）。
     * 注意: idempotent ではないため、重複マウントは呼び出し側で避けること。
     */
    mount(parentNode) {
        for (let i = 0; i < this.childNodes.length; i++) {
            parentNode.appendChild(this.childNodes[i]);
        }
    }
    /**
     * 指定ノードの直前にマウント（insertBefore）。
     */
    mountBefore(parentNode, beforeNode) {
        for (let i = 0; i < this.childNodes.length; i++) {
            parentNode.insertBefore(this.childNodes[i], beforeNode);
        }
    }
    /**
     * 指定ノードの直後にマウント（afterNode.nextSibling を before にして insertBefore）。
     */
    mountAfter(parentNode, afterNode) {
        const beforeNode = afterNode?.nextSibling ?? null;
        for (let i = 0; i < this.childNodes.length; i++) {
            parentNode.insertBefore(this.childNodes[i], beforeNode);
        }
    }
    /**
     * アンマウント（親から childNodes を一括で取り外す）。
     * コメント/テキストノードにも対応するため parentNode を使用。
     * 親が既に無い場合は no-op。
     */
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
    /**
     * 生成済みの全 Binding を初期化。
     * createBindContent 直後および assignListIndex 後に呼び出される。
     */
    init() {
        for (let i = 0; i < this.bindings.length; i++) {
            this.bindings[i].init();
        }
    }
    /**
     * ループ中の ListIndex を再割当てし、Bindings を再初期化する。
     * Throws:
     * - BIND-201 LoopContext が未初期化
     */
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
    /**
     * 変更適用エントリポイント。
     * Renderer から呼ばれ、各 Binding に applyChange を委譲する。
     * renderer.updatedBindings に載っているものは二重適用を避ける。
     */
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
