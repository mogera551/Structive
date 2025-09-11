import { listWalker } from "../ListWalker/listWalker";
import { createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy";
import { GetByRefSymbol, SetCacheableSymbol } from "../StateClass/symbols";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
import { raiseError } from "../utils";
import { getListDiffResults } from "./getListDiffResults";
class Renderer {
    #updatedBindings = new Set();
    #trackedRefKeys = new Set();
    #listDiffResultsByRefKey = new Map();
    #engine;
    #readonlyState = null;
    constructor(engine) {
        this.#engine = engine;
    }
    get updatedBindings() {
        return this.#updatedBindings;
    }
    get trackedRefKeys() {
        return this.#trackedRefKeys;
    }
    get readonlyState() {
        if (!this.#readonlyState) {
            raiseError("ReadonlyState is not initialized.");
        }
        return this.#readonlyState;
    }
    get engine() {
        if (!this.#engine) {
            raiseError("Engine is not initialized.");
        }
        return this.#engine;
    }
    render(items) {
        // 実際のレンダリングロジックを実装
        const readonlyState = this.#readonlyState = createReadonlyStateProxy(this.#engine, this.#engine.state);
        try {
            readonlyState[SetCacheableSymbol](() => {
                // リストの差分計算実行
                for (const item of items) {
                    if (this.engine.pathManager.lists.has(item.info.pattern)) {
                        this.updateListIndexes(item.info, item.listIndex);
                    }
                }
                // 各Ref情報に対してレンダリングを実行
                // trackedRefKeysに追加されているRef情報はスキップ
                // updatedBindingsに追加されているバインディングはスキップ
                for (const item of items) {
                    this.renderItem(item.info, item.listIndex, this.trackedRefKeys, this.updatedBindings, readonlyState);
                }
            });
        }
        finally {
            this.#readonlyState = null;
            this.#listDiffResultsByRefKey.clear();
            this.#trackedRefKeys.clear();
            this.#updatedBindings.clear();
        }
    }
    getListDiffResults(info, listIndex) {
        if (this.isListValue(info) === false) {
            raiseError("The specified info is not a list value.");
        }
        const refKey = createRefKey(info, listIndex);
        let listDiffResults = this.#listDiffResultsByRefKey.get(refKey);
        if (!listDiffResults) {
            const newValue = this.readonlyState[GetByRefSymbol](info, listIndex);
            const oldValue = this.getOldValue(info, listIndex);
            const oldListIndexesSet = this.getOldListIndexesSet(info, listIndex);
            listDiffResults = getListDiffResults(oldValue, oldListIndexesSet, newValue, listIndex);
            this.#listDiffResultsByRefKey.set(refKey, listDiffResults);
            /**
             * ToDo: undefinedの場合の扱いをどうするか検討
             * - 現状はundefinedを空配列として扱う
             */
            this.setOldValue(info, listIndex, newValue ?? []);
            /**
             * ToDo: undefinedの扱いをどうするか検討
             * - 現状はundefinedを空Setとして扱う
             */
            this.setOldListIndexesSet(info, listIndex, listDiffResults.newListIndexesSet ?? new Set());
        }
        return listDiffResults;
    }
    isListValue(info) {
        return this.engine.pathManager.lists.has(info.pattern);
    }
    getOldListIndexesSet(info, listIndex) {
        // 仮実装、実際にはエンジンから古いリストインデックスセットを取得
        return this.engine.getListIndexesSet(info, listIndex) ?? null;
    }
    setOldListIndexesSet(info, listIndex, listIndexesSet) {
        // 仮実装、実際にはエンジンに古いリストインデックスセットを保存
        this.engine.saveListIndexesSet(info, listIndex, listIndexesSet);
    }
    getOldValue(info, listIndex) {
        // 仮実装、実際にはエンジンから古い値を取得
        return this.engine.getList(info, listIndex) ?? null;
    }
    setOldValue(info, listIndex, value) {
        // 仮実装、実際にはエンジンに古い値を保存
        this.engine.saveList(info, listIndex, value);
    }
    getBindings(info, listIndex) {
        // 仮実装、実際にはエンジンからバインディングを取得
        return this.engine.getBindings(info, listIndex) ?? [];
    }
    updateListIndexes(info, listIndex) {
        const diffResult = this.getListDiffResults(info, listIndex);
        for (const path of this.engine.pathManager.lists) {
            const pathInfo = getStructuredPathInfo(path);
            const wildcardInfo = pathInfo.wildcardParentInfos.at(-2);
            if (typeof wildcardInfo === "undefined" || wildcardInfo !== info) {
                continue;
            }
            for (const subListIndex of diffResult.adds ?? []) {
                this.updateListIndexes(pathInfo, subListIndex);
            }
        }
    }
    renderItem(info, listIndex, trackedRefKeys, updatedBindings, readonlyState) {
        const refKey = createRefKey(info, listIndex);
        if (trackedRefKeys.has(refKey)) {
            return; // すでに処理済みのRef情報はスキップ
        }
        trackedRefKeys.add(refKey);
        // バインディングに変更を適用する
        // 変更があったバインディングはupdatedBindingsに追加する
        const bindings = this.getBindings(info, listIndex);
        for (const binding of bindings) {
            if (updatedBindings.has(binding)) {
                continue; // すでに更新済みのバインディングはスキップ
            }
            binding.applyChange(this);
        }
        // 静的・動的依存要素のレンダリング
        const isList = this.isListValue(info);
        const diffResults = isList ? this.#listDiffResultsByRefKey.get(refKey) : null;
        const elementInfo = isList ? getStructuredPathInfo(info.pattern + ".*") : null;
        // 静的依存要素のレンダリング
        for (const subPath of this.#engine?.pathManager.staticDependencies.get(info.pattern) ?? []) {
            const subInfo = getStructuredPathInfo(subPath);
            if (elementInfo?.pattern && subInfo.wildcardPathSet.has(elementInfo.pattern)) {
                // リストの依存要素の場合
                for (const subListIndex of diffResults?.newListIndexesSet ?? []) {
                    this.renderItem(subInfo, subListIndex, trackedRefKeys, updatedBindings, readonlyState);
                }
            }
            else {
                this.renderItem(subInfo, listIndex, trackedRefKeys, updatedBindings, readonlyState);
            }
        }
        // 動的依存要素のレンダリング
        for (const subPath of this.#engine?.pathManager.dynamicDependencies.get(info.pattern) ?? []) {
            const subInfo = getStructuredPathInfo(subPath);
            // リストの依存要素の場合は、静的依存で処理済み
            if (subInfo.wildcardCount > 0) {
                const parentMatchPaths = subInfo.wildcardPathSet.intersection(elementInfo?.wildcardPathSet ?? new Set());
                if (parentMatchPaths.size > 0) {
                    if (diffResults?.newListIndexesSet?.size === parentMatchPaths.size) {
                        // リストパスが完全に一致する場合
                        for (const subListIndex of diffResults?.newListIndexesSet ?? []) {
                            listWalker(this.engine, subInfo, subListIndex, (_info, _listIndex) => {
                                this.renderItem(_info, _listIndex, trackedRefKeys, updatedBindings, readonlyState);
                            });
                        }
                    }
                    else {
                        // リストパスが一部一致する場合
                        const lastMatchPath = Array.from(parentMatchPaths).at(-1); // 共通パスを取得
                        const lastMatchInfo = getStructuredPathInfo(lastMatchPath); // ワイルドカードのパス情報を取得
                        // 共通パスのワイルドカードの深さまでlistIndexを辿る
                        const subListIndex = listIndex?.at(lastMatchInfo.wildcardCount - 1) ?? null;
                        listWalker(this.engine, subInfo, subListIndex, (_info, _listIndex) => {
                            this.renderItem(_info, _listIndex, trackedRefKeys, updatedBindings, readonlyState);
                        });
                    }
                }
                else {
                    // まったく無関係なリストの場合リストを展開しながらレンダリング
                    listWalker(this.engine, subInfo, null, (subInfo, subListIndex) => {
                        this.renderItem(subInfo, subListIndex, trackedRefKeys, updatedBindings, readonlyState);
                    });
                }
            }
            else {
                this.renderItem(subInfo, null, trackedRefKeys, updatedBindings, readonlyState);
            }
        }
    }
}
export function render(items, engine) {
    const renderer = new Renderer(engine);
    renderer.render(items);
}
