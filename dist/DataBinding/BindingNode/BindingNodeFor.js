import { createFilters } from "../../BindingBuilder/createFilters.js";
import { raiseError } from "../../utils.js";
import { createBindContent } from "../BindContent.js";
import { BindingNodeBlock } from "./BindingNodeBlock.js";
class BindingNodeFor extends BindingNodeBlock {
    #bindContentsSet = new Set();
    #bindContentByListIndex = new WeakMap();
    #bindContentPool = [];
    #bindContentLastIndex = 0;
    get bindContents() {
        return this.#bindContentsSet;
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
        this.bindContentLastIndex = this.poolLength - 1;
        const newBindContensSet = new Set();
        let lastBindContent = null;
        const parentNode = this.node.parentNode;
        if (parentNode == null) {
            raiseError(`BindingNodeFor.update: parentNode is null`);
        }
        for (const listIndex of listIndexesSet) {
            const lastNode = lastBindContent?.getLastNode(parentNode) ?? this.node;
            let bindContent = this.#bindContentByListIndex.get(listIndex);
            if (typeof bindContent === "undefined") {
                bindContent = this.createBindContent(listIndex);
                bindContent.render();
                bindContent.mountAfter(parentNode, lastNode);
            }
            else {
                if (lastNode.nextSibling !== bindContent.firstChildNode) {
                    bindContent.mountAfter(parentNode, lastNode);
                }
            }
            newBindContensSet.add(bindContent);
            lastBindContent = bindContent;
        }
        // プールの長さを更新する
        // プールの長さは、プールの最後の要素のインデックス+1であるため、
        this.poolLength = this.bindContentLastIndex + 1;
        // 削除
        const removeBindContentsSet = this.#bindContentsSet.difference(newBindContensSet);
        for (const bindContent of removeBindContentsSet) {
            this.deleteBindContent(bindContent);
        }
        this.#bindContentPool.push(...removeBindContentsSet);
        this.#bindContentsSet = newBindContensSet;
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
export const createBindingNodeFor = (name, filterTexts, event) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeFor(binding, node, name, filterFns, event);
};
