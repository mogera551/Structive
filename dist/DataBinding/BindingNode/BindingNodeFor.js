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
        raiseError("BindingNodeFor.assignValue: Not implemented. Use update or applyChange.");
    }
    applyChange(renderer) {
        if (renderer.updatedBindings.has(this.binding))
            return;
        const newBindContentsSet = new Set();
        // 削除を先にする
        const removeBindContentsSet = new Set();
        const info = this.binding.bindingState.info;
        const listIndex = this.binding.bindingState.listIndex;
        const listIndexResults = renderer.getListDiffResults(info, listIndex);
        for (const listIndex of listIndexResults.removes ?? []) {
            const bindContent = this.#bindContentByListIndex.get(listIndex);
            if (bindContent) {
                this.deleteBindContent(bindContent);
                removeBindContentsSet.add(bindContent);
            }
        }
        this.#bindContentPool.push(...removeBindContentsSet);
        let lastBindContent = null;
        const parentNode = this.node.parentNode ?? raiseError(`BindingNodeFor.update: parentNode is null`);
        const firstNode = this.node;
        this.bindContentLastIndex = this.poolLength - 1;
        for (const listIndex of listIndexResults.newListIndexesSet ?? []) {
            const lastNode = lastBindContent?.getLastNode(parentNode) ?? firstNode;
            let bindContent;
            if (listIndexResults.adds?.has(listIndex)) {
                bindContent = this.createBindContent(listIndex);
                bindContent.mountAfter(parentNode, lastNode);
                bindContent.applyChange(renderer);
            }
            else {
                bindContent = this.#bindContentByListIndex.get(listIndex);
                if (typeof bindContent === "undefined") {
                    raiseError(`BindingNodeFor.assignValue2: bindContent is not found`);
                }
                if (lastNode?.nextSibling !== bindContent.firstChildNode) {
                    bindContent.mountAfter(parentNode, lastNode);
                }
            }
            newBindContentsSet.add(bindContent);
            lastBindContent = bindContent;
        }
        // リストインデックスの並び替え
        // リストインデックスの並び替え時、インデックスの変更だけなので、要素の再描画はしたくない
        // 並べ替えはするが、要素の内容は変わらないため
        if (listIndexResults.swapTargets && listIndexResults.swapSources) {
            const bindContents = Array.from(this.#bindContentsSet);
            const targets = Array.from(listIndexResults.swapTargets);
            const sources = Array.from(listIndexResults.swapSources);
            for (let i = 0; i < targets.length; i++) {
                const targetListIndex = targets[i];
                const sourceListIndex = sources[i];
                const sourceBindContent = this.#bindContentByListIndex.get(sourceListIndex);
                if (typeof sourceBindContent === "undefined") {
                    raiseError(`BindingNodeFor.assignValue2: bindContent is not found`);
                }
                bindContents[targetListIndex.index] = sourceBindContent;
                this.#bindContentByListIndex.set(targetListIndex, sourceBindContent);
                const lastNode = bindContents[targetListIndex.index - 1]?.getLastNode(parentNode) ?? firstNode;
                sourceBindContent.mountAfter(parentNode, lastNode);
            }
        }
        // リスト要素の上書き
        if (listIndexResults.replaces) {
            for (const listIndex of listIndexResults.replaces) {
                const bindContent = this.#bindContentByListIndex.get(listIndex);
                if (typeof bindContent === "undefined") {
                    raiseError(`BindingNodeFor.assignValue2: bindContent is not found`);
                }
                bindContent.applyChange(renderer);
            }
        }
        // プールの長さを更新する
        // プールの長さは、プールの最後の要素のインデックス+1であるため、
        this.poolLength = this.bindContentLastIndex + 1;
        this.#bindContentsSet = newBindContentsSet;
    }
}
export const createBindingNodeFor = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeFor(binding, node, name, filterFns, decorates);
};
