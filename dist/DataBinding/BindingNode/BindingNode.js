import { raiseError } from "../../utils.js";
/**
 * BindingNodeクラスは、1つのバインディング対象ノード（ElementやTextなど）に対する
 * バインディング処理の基底クラスです。
 *
 * 主な役割:
 * - ノード・プロパティ名・フィルタ・デコレータ・バインディング情報の保持
 * - バインディング値の更新（update）、値の割り当て（assignValue）のインターフェース提供
 * - 複数バインド内容（bindContents）の管理
 * - サブクラスでassignValueやupdateElementsを実装し、各種ノード・プロパティごとのバインディング処理を拡張
 *
 * 設計ポイント:
 * - assignValue, updateElementsは未実装（サブクラスでオーバーライド必須）
 * - isSelectElement, value, filteredValue, isForなどはサブクラスで用途に応じて拡張
 * - フィルタやデコレータ、バインド内容の管理も柔軟に対応
 */
export class BindingNode {
    #binding;
    #node;
    #name;
    #filters;
    #decorates;
    #bindContents = new Set();
    get node() {
        return this.#node;
    }
    get name() {
        return this.#name;
    }
    get subName() {
        return this.#name;
    }
    get binding() {
        return this.#binding;
    }
    get decorates() {
        return this.#decorates;
    }
    get filters() {
        return this.#filters;
    }
    get bindContents() {
        return this.#bindContents;
    }
    constructor(binding, node, name, filters, decorates) {
        this.#binding = binding;
        this.#node = node;
        this.#name = name;
        this.#filters = filters;
        this.#decorates = decorates;
    }
    init() {
        // サブクラスで初期化処理を実装可能
    }
    update() {
        this.assignValue(this.binding.bindingState.filteredValue);
    }
    assignValue(value) {
        raiseError(`BindingNode: assignValue not implemented`);
    }
    updateElements(listIndexes, values) {
        raiseError(`BindingNode: updateElements not implemented`);
    }
    notifyRedraw(refs) {
        // サブクラスで親子関係を考慮してバインディングの更新を通知する実装が可能
    }
    get isSelectElement() {
        return this.node instanceof HTMLSelectElement;
    }
    get value() {
        return null;
    }
    get filteredValue() {
        return null;
    }
    get isFor() {
        return false;
    }
}
