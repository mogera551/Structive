import { createFilters } from "../../BindingBuilder/createFilters.js";
import { raiseError } from "../../utils.js";
import { createBindContent } from "../BindContent.js";
import { BindingNodeBlock } from "./BindingNodeBlock.js";
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
 * - assignValueでリストの差分を検出し、BindContentの生成・削除・再利用を管理
 * - updateElementsでリストの並び替えやSWAP処理にも対応
 * - BindContentのプール・インデックス管理でGCやDOM操作の最小化を図る
 * - バインディング状態やリストインデックス情報をエンジンに保存し、再描画や依存解決を容易にする
 *
 * ファクトリ関数 createBindingNodeFor でフィルタ・デコレータ適用済みインスタンスを生成
 */
class BindingNodeFor extends BindingNodeBlock {
    #bindContentsSet = new Set();
    #bindContentByListIndex = new WeakMap();
    #bindContentPool = [];
    #bindContentLastIndex = 0;
    #lastListIndexSet = new Set();
    get bindContents() {
        return this.#bindContentsSet;
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
            bindContent = createBindContent(this.binding, this.id, this.binding.engine, this.binding.bindingState.pattern + ".*", listIndex);
        }
        // 登録
        this.#bindContentByListIndex.set(listIndex, bindContent);
        return bindContent;
    }
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
            raiseError(`BindingNodeFor.setPoolLength: length is negative`);
        }
        this.#bindContentPool.length = length;
    }
    assignValue(value) {
        if (!Array.isArray(value)) {
            raiseError(`BindingNodeFor.assignValue: value is not array`);
        }
        const listIndexesSet = this.binding.engine.getListIndexesSet(this.binding.bindingState.info, this.binding.bindingState.listIndex);
        if (listIndexesSet === null) {
            raiseError(`BindingNodeFor.assignValue: listIndexes is not found`);
        }
        const newBindContensSet = new Set();
        let lastBindContent = null;
        // 削除を先にする
        const removeBindContentsSet = new Set();
        const diff = this.#lastListIndexSet.difference(listIndexesSet);
        for (const listIndex of diff) {
            const bindContent = this.#bindContentByListIndex.get(listIndex);
            if (bindContent) {
                this.deleteBindContent(bindContent);
                removeBindContentsSet.add(bindContent);
            }
        }
        this.#bindContentPool.push(...removeBindContentsSet);
        const parentNode = this.node.parentNode ?? raiseError(`BindingNodeFor.update: parentNode is null`);
        const firstNode = this.node;
        this.bindContentLastIndex = this.poolLength - 1;
        for (const listIndex of listIndexesSet) {
            const lastNode = lastBindContent?.getLastNode(parentNode) ?? firstNode;
            let bindContent = this.#bindContentByListIndex.get(listIndex);
            if (typeof bindContent === "undefined") {
                bindContent = this.createBindContent(listIndex);
                bindContent.mountAfter(parentNode, lastNode);
                bindContent.render();
            }
            else {
                if (lastNode?.nextSibling !== bindContent.firstChildNode) {
                    bindContent.mountAfter(parentNode, lastNode);
                }
            }
            newBindContensSet.add(bindContent);
            lastBindContent = bindContent;
        }
        // プールの長さを更新する
        // プールの長さは、プールの最後の要素のインデックス+1であるため、
        this.poolLength = this.bindContentLastIndex + 1;
        this.#bindContentsSet = newBindContensSet;
        this.#lastListIndexSet = new Set(listIndexesSet);
    }
    /**
     * SWAP処理を想定
     *
     * @param listIndexes
     * @param values
     * @returns
     */
    updateElements(listIndexes, values) {
        if (typeof values[0] !== "object")
            return;
        const engine = this.binding.engine;
        const oldListValues = engine.getList(this.binding.bindingState.info, this.binding.bindingState.listIndex) ?? raiseError(`BindingNodeFor.updateElements: oldValues is not found`);
        const parentNode = this.node.parentNode ?? raiseError(`BindingNodeFor.update: parentNode is null`);
        // DOMから削除
        const currentBindContents = Array.from(this.#bindContentsSet);
        const targetBindContents = [];
        for (let i = 0; i < listIndexes.length; i++) {
            const listIndex = listIndexes[i];
            const bindContent = currentBindContents[listIndex.index];
            bindContent.unmount();
            targetBindContents.push(bindContent);
        }
        // DOMに追加、listIndexを更新
        for (let i = 0; i < listIndexes.length; i++) {
            const listIndex = listIndexes[i];
            const index = listIndex.index;
            const lastBindContent = currentBindContents[index - 1] ?? null;
            const lastNode = lastBindContent?.lastChildNode ?? this.node;
            const oldValue = oldListValues[index];
            const targetIndex = values.indexOf(oldValue);
            const prevBindContent = targetBindContents[targetIndex];
            if (typeof prevBindContent === "undefined") {
                // 入れ替えるBindContentがない場合は再描画
                const bindContent = targetBindContents[index];
                bindContent.render();
                bindContent.mountAfter(parentNode, lastNode);
            }
            else {
                prevBindContent.assignListIndex(listIndex);
                prevBindContent.mountAfter(parentNode, lastNode);
                this.#bindContentByListIndex.set(listIndex, prevBindContent);
                currentBindContents[index] = prevBindContent;
            }
            if (targetIndex >= 0) {
                values[targetIndex] = -1;
            }
        }
        this.#bindContentsSet = new Set(currentBindContents);
        engine.saveList(this.binding.bindingState.info, this.binding.bindingState.listIndex, this.binding.bindingState.value.slice(0));
    }
}
export const createBindingNodeFor = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeFor(binding, node, name, filterFns, decorates);
};
