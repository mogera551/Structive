import { createFilters } from "../../BindingBuilder/createFilters.js";
import { GetByRefSymbol, GetListIndexesByRefSymbol } from "../../StateClass/symbols.js";
import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo.js";
import { getStatePropertyRef } from "../../StatePropertyRef/StatepropertyRef.js";
import { raiseError } from "../../utils.js";
import { createBindContent } from "../BindContent.js";
import { BindingNodeBlock } from "./BindingNodeBlock.js";
const EMPTY_SET = new Set();
/**
 * フラグメントに追加し、一括でノードで追加するかのフラグ
 * ベンチマークの結果で判断する
 */
const USE_ALL_APPEND = globalThis.__STRUCTIVE_USE_ALL_APPEND__ === true;
/**
 * BindingNodeForクラスは、forバインディング（配列やリストの繰り返し描画）を担当するバインディングノードの実装です。
 *
 * 主な役割:
 * - リストデータの各要素ごとにBindContent（バインディングコンテキスト）を生成・管理
 * - 配列の差分検出により、必要なBindContentの生成・再利用・削除・再描画を最適化
 * - DOM上での要素の並び替えや再利用、アンマウント・マウント処理を効率的に行う
 * - プール機構によりBindContentの再利用を促進し、パフォーマンスを向上
 *
 * 設計ポイント:
 * - applyChangeでリストの差分を検出し、BindContentの生成・削除・再利用を管理
 * - 追加・削除が無い場合はリオーダー（並べ替え）のみをDOM移動で処理し、再描画を抑制
 * - 上書き（overwrites）は同位置の内容変化のため、applyChangeを再実行
 * - BindContentのプール・インデックス管理でGCやDOM操作の最小化を図る
 * - バインディング状態やリストインデックス情報をエンジンに保存し、再描画や依存解決を容易にする
 *
 * Throws（代表例）:
 * - BIND-201 ParentNode is null / BindContent not found など applyChange 実行時の不整合
 * - BIND-202 Length is negative: プール長の不正設定
 * - BIND-301 Not implemented. Use update or applyChange: assignValue は未実装
 *
 * ファクトリ関数 createBindingNodeFor でフィルタ・デコレータ適用済みインスタンスを生成
 */
class BindingNodeFor extends BindingNodeBlock {
    #bindContents = [];
    #bindContentByListIndex = new WeakMap();
    #bindContentPool = [];
    #bindContentLastIndex = 0;
    #loopInfo = undefined;
    #oldList = undefined;
    #oldListIndexes = [];
    #oldListIndexSet = new Set();
    get bindContents() {
        return this.#bindContents;
    }
    get isFor() {
        return true;
    }
    init() {
    }
    createBindContent(listIndex) {
        let bindContent;
        if (this.#bindContentLastIndex >= 0) {
            // プールの最後の要素を取得して、プールの長さをあとで縮減する
            // 作るたびにプールを縮減すると、パフォーマンスが悪化するため
            // プールの長さを縮減するのは、全ての要素を作った後に行う
            bindContent = this.#bindContentPool[this.#bindContentLastIndex];
            this.#bindContentLastIndex--;
            bindContent.assignListIndex(listIndex);
        }
        else {
            const loopRef = getStatePropertyRef(this.loopInfo, listIndex);
            bindContent = createBindContent(this.binding, this.id, this.binding.engine, loopRef);
        }
        // 登録
        this.#bindContentByListIndex.set(listIndex, bindContent);
        return bindContent;
    }
    /**
     * BindContent を削除（アンマウント）し、ループ文脈のインデックスもクリアする。
     */
    deleteBindContent(bindContent) {
        bindContent.unmount();
        bindContent.loopContext?.clearListIndex();
    }
    get bindContentLastIndex() {
        return this.#bindContentLastIndex;
    }
    set bindContentLastIndex(value) {
        this.#bindContentLastIndex = value;
    }
    get poolLength() {
        return this.#bindContentPool.length;
    }
    set poolLength(length) {
        if (length < 0) {
            raiseError({
                code: 'BIND-202',
                message: 'Length is negative',
                context: { where: 'BindingNodeFor.setPoolLength', length },
                docsUrl: './docs/error-codes.md#bind',
            });
        }
        this.#bindContentPool.length = length;
    }
    get loopInfo() {
        if (typeof this.#loopInfo === "undefined") {
            const loopPath = this.binding.bindingState.pattern + ".*";
            this.#loopInfo = getStructuredPathInfo(loopPath);
        }
        return this.#loopInfo;
    }
    assignValue(value) {
        raiseError({
            code: 'BIND-301',
            message: 'Not implemented. Use update or applyChange',
            context: { where: 'BindingNodeFor.assignValue' },
            docsUrl: './docs/error-codes.md#bind',
        });
    }
    /**
     * リストの差分を適用して DOM とバインディングを更新する中核メソッド。
     *
     * - 追加/削除がある場合: add は生成+mount+applyChange、reuse は位置調整のみ
     * - 追加/削除が無い場合: changeIndexes はDOM移動のみ（再描画なし）、overwrites は applyChange を呼ぶ
     * - 全削除/全追加はフラグメント最適化を適用
     */
    applyChange(renderer) {
        let newBindContents = [];
        const newList = renderer.readonlyState[GetByRefSymbol](this.binding.bindingState.ref);
        const newListIndexes = renderer.readonlyState[GetListIndexesByRefSymbol](this.binding.bindingState.ref) ?? [];
        const newListIndexesSet = new Set(newListIndexes);
        const oldSet = new Set(this.#oldList ?? EMPTY_SET);
        const oldListLength = this.#oldList?.length ?? 0;
        const removesSet = newListIndexesSet.size === 0 ? this.#oldListIndexSet : this.#oldListIndexSet.difference(newListIndexesSet);
        const addsSet = this.#oldListIndexSet.size === 0 ? newListIndexesSet : newListIndexesSet.difference(this.#oldListIndexSet);
        const newListLength = newList?.length ?? 0;
        const changeIndexesSet = new Set();
        const overwritesSet = new Set();
        const elementsPath = this.binding.bindingState.info.pattern + ".*";
        for (let i = 0; i < renderer.updatingRefs.length; i++) {
            const updatingRef = renderer.updatingRefs[i];
            if (updatingRef.info.pattern !== elementsPath)
                continue;
            if (renderer.processedRefs.has(updatingRef))
                continue;
            const listIndex = updatingRef.listIndex;
            if (listIndex === null) {
                raiseError({
                    code: 'BIND-201',
                    message: 'ListIndex is null',
                    context: { where: 'BindingNodeFor.applyChange', ref: updatingRef },
                    docsUrl: './docs/error-codes.md#bind',
                });
            }
            if (this.#oldListIndexSet.has(listIndex)) {
                changeIndexesSet.add(listIndex);
            }
            else {
                overwritesSet.add(listIndex);
            }
            renderer.processedRefs.add(updatingRef);
        }
        const parentNode = this.node.parentNode ?? raiseError({
            code: 'BIND-201',
            message: 'ParentNode is null',
            context: { where: 'BindingNodeFor.applyChange' },
            docsUrl: './docs/error-codes.md#bind',
        });
        // 削除を先にする
        const removeBindContentsSet = new Set();
        // 全削除最適化のフラグ
        const isAllRemove = (oldListLength === removesSet.size && oldListLength > 0);
        // 親ノードこのノードだけ持つかのチェック
        let isParentNodeHasOnlyThisNode = false;
        if (isAllRemove) {
            const parentChildNodes = Array.from(parentNode.childNodes);
            const lastContent = this.#bindContents.at(-1) ?? raiseError({
                code: 'BIND-201',
                message: 'Last content is null',
                context: { where: 'BindingNodeFor.applyChange' },
                docsUrl: '/docs/error-codes.md#bind',
            });
            // ブランクノードを飛ばす
            let firstNode = parentChildNodes[0];
            while (firstNode && firstNode.nodeType === Node.TEXT_NODE && firstNode.textContent?.trim() === "") {
                firstNode = firstNode.nextSibling;
            }
            let lastNode = parentChildNodes.at(-1) ?? null;
            while (lastNode && lastNode.nodeType === Node.TEXT_NODE && lastNode.textContent?.trim() === "") {
                lastNode = lastNode.previousSibling;
            }
            if (firstNode === this.node && lastNode === lastContent.getLastNode(parentNode)) {
                isParentNodeHasOnlyThisNode = true;
            }
        }
        if (isAllRemove && isParentNodeHasOnlyThisNode) {
            // 全削除最適化
            parentNode.textContent = "";
            parentNode.append(this.node);
            for (let i = 0; i < this.#bindContents.length; i++) {
                const bindContent = this.#bindContents[i];
                bindContent.loopContext?.clearListIndex();
            }
            this.#bindContentPool.push(...this.#bindContents);
        }
        else {
            if (removesSet.size > 0) {
                for (const listIndex of removesSet) {
                    const bindContent = this.#bindContentByListIndex.get(listIndex);
                    if (typeof bindContent === "undefined") {
                        raiseError({
                            code: 'BIND-201',
                            message: 'BindContent not found',
                            context: { where: 'BindingNodeFor.applyChange', when: 'removes' },
                            docsUrl: './docs/error-codes.md#bind',
                        });
                    }
                    this.deleteBindContent(bindContent);
                    removeBindContentsSet.add(bindContent);
                }
                this.#bindContentPool.push(...removeBindContentsSet);
            }
        }
        let lastBindContent = null;
        const firstNode = this.node;
        this.bindContentLastIndex = this.poolLength - 1;
        const isAllAppend = USE_ALL_APPEND && (newListLength === addsSet.size && newListLength > 0);
        // リオーダー判定: 追加・削除がなく、並び替え（changeIndexes）または上書き（overwrites）のみの場合
        const isReorder = addsSet.size === 0 && removesSet.size === 0 &&
            (changeIndexesSet.size > 0 || overwritesSet.size > 0);
        if (!isReorder) {
            const oldIndexByListIndex = new Map();
            for (let i = 0; i < this.#oldListIndexes.length; i++) {
                oldIndexByListIndex.set(this.#oldListIndexes[i], i);
            }
            // 全追加の場合、バッファリングしてから一括追加する
            const fragmentParentNode = isAllAppend ? document.createDocumentFragment() : parentNode;
            const fragmentFirstNode = isAllAppend ? null : firstNode;
            const changeListIndexes = [];
            for (let i = 0; i < newListIndexes.length; i++) {
                const listIndex = newListIndexes[i];
                const lastNode = lastBindContent?.getLastNode(fragmentParentNode) ?? fragmentFirstNode;
                let bindContent;
                if (addsSet.has(listIndex)) {
                    bindContent = this.createBindContent(listIndex);
                    bindContent.mountAfter(fragmentParentNode, lastNode);
                    bindContent.applyChange(renderer);
                }
                else {
                    bindContent = this.#bindContentByListIndex.get(listIndex);
                    if (typeof bindContent === "undefined") {
                        raiseError({
                            code: 'BIND-201',
                            message: 'BindContent not found',
                            context: { where: 'BindingNodeFor.applyChange', when: 'reuse' },
                            docsUrl: './docs/error-codes.md#bind',
                        });
                    }
                    if (lastNode?.nextSibling !== bindContent.firstChildNode) {
                        bindContent.mountAfter(fragmentParentNode, lastNode);
                    }
                    const oldIndex = oldIndexByListIndex.get(listIndex);
                    if (typeof oldIndex !== "undefined" && oldIndex !== i) {
                        changeListIndexes.push(listIndex);
                    }
                }
                newBindContents.push(bindContent);
                lastBindContent = bindContent;
            }
            // 全追加最適化
            if (isAllAppend) {
                const beforeNode = firstNode.nextSibling;
                parentNode.insertBefore(fragmentParentNode, beforeNode);
            }
            for (const listIndex of changeListIndexes) {
                const bindings = this.binding.bindingsByListIndex.get(listIndex) ?? [];
                for (const binding of bindings) {
                    if (renderer.updatedBindings.has(binding))
                        continue;
                    binding.applyChange(renderer);
                }
            }
        }
        else {
            // リオーダー処理: 要素の追加・削除がない場合の最適化処理
            // 並び替え処理: インデックスの変更のみなので、要素の再描画は不要
            // DOM位置の調整のみ行い、BindContentの内容は再利用する
            if (changeIndexesSet.size > 0) {
                const bindContents = Array.from(this.#bindContents);
                const changeIndexes = Array.from(changeIndexesSet);
                changeIndexes.sort((a, b) => a.index - b.index);
                for (const listIndex of changeIndexes) {
                    const bindContent = this.#bindContentByListIndex.get(listIndex);
                    if (typeof bindContent === "undefined") {
                        raiseError({
                            code: 'BIND-201',
                            message: 'BindContent not found',
                            context: { where: 'BindingNodeFor.applyChange', when: 'reorder' },
                            docsUrl: '/docs/error-codes.md#bind',
                        });
                    }
                    bindContents[listIndex.index] = bindContent;
                    const lastNode = bindContents[listIndex.index - 1]?.getLastNode(parentNode) ?? firstNode;
                    bindContent.mountAfter(parentNode, lastNode);
                }
                newBindContents = bindContents;
            }
            // 上書き処理: 同じ位置の要素が異なる値に変更された場合の再描画
            if (overwritesSet.size > 0) {
                for (const listIndex of overwritesSet) {
                    const bindContent = this.#bindContentByListIndex.get(listIndex);
                    if (typeof bindContent === "undefined") {
                        raiseError({
                            code: 'BIND-201',
                            message: 'BindContent not found',
                            context: { where: 'BindingNodeFor.applyChange', when: 'overwrites' },
                            docsUrl: './docs/error-codes.md#bind',
                        });
                    }
                    bindContent.applyChange(renderer);
                }
            }
        }
        // プールの長さを更新する
        // プールの長さは、プールの最後の要素のインデックス+1であるため、
        this.poolLength = this.bindContentLastIndex + 1;
        this.#bindContents = newBindContents;
        this.#oldList = [...newList];
        this.#oldListIndexes = [...newListIndexes];
        this.#oldListIndexSet = newListIndexesSet;
    }
}
export const createBindingNodeFor = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeFor(binding, node, name, filterFns, decorates);
};
