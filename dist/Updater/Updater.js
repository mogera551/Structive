import { WILDCARD } from "../constants";
import { calcListDiff } from "../ListDiff/ListDiff";
import { createListIndex } from "../ListIndex/ListIndex";
import { findPathNodeByPath } from "../PathTree/PathNode";
import { GetByRefSymbol } from "../StateClass/symbols";
import { useWritableStateProxy } from "../StateClass/useWritableStateProxy";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef";
import { raiseError } from "../utils";
import { render } from "./Renderer";
/**
 * Updater2クラスは、状態管理と更新の中心的な役割を果たします。
 * 状態更新が必要な場合に、都度インスタンスを作成して使用します。
 * 主な機能は以下の通りです:
 */
class Updater {
    queue = [];
    #updating = false;
    #rendering = false;
    #engine;
    #state = undefined;
    #updateInfo;
    constructor(engine) {
        this.#engine = engine;
        this.#updateInfo = {
            updatedRefs: new Set(),
            cacheValueByRef: new Map(),
            oldValueAndIndexesByRef: new Map(),
            listDiffByRef: new Map(),
        };
    }
    get state() {
        if (!this.#state)
            throw new Error("State not initialized");
        return this.#state;
    }
    // Ref情報をキューに追加
    enqueueRef(ref) {
        this.queue.push(ref);
        this.prepareRender(this.#engine, this.state, this.#updateInfo, ref);
        if (this.#rendering)
            return;
        this.#rendering = true;
        queueMicrotask(() => {
            this.rendering();
        });
    }
    // 状態更新開始
    async beginUpdate(loopContext, callback) {
        try {
            this.#updating = true;
            await useWritableStateProxy(this.#engine, this, this.#engine.state, loopContext, async (state, handler) => {
                // 状態更新処理
                this.#state = state;
                await callback(state, handler);
            });
        }
        finally {
            this.#updating = false;
        }
    }
    // レンダリング
    rendering() {
        try {
            while (this.queue.length > 0) {
                // キュー取得
                const queue = this.queue;
                this.queue = [];
                if (!this.#engine)
                    raiseError({
                        code: "UPD-001",
                        message: "Engine not initialized",
                        docsUrl: "./docs/error-codes.md#upd",
                    });
                // レンダリング実行
                render(queue, this.#engine);
            }
        }
        finally {
            this.#rendering = false;
        }
    }
    getOldListAndListIndexes(engine, updateInfo, ref) {
        let saveInfo = updateInfo.oldValueAndIndexesByRef.get(ref);
        if (typeof saveInfo === "undefined") {
            saveInfo = engine.getListAndListIndexes(ref);
            updateInfo.oldValueAndIndexesByRef.set(ref, saveInfo);
        }
        return saveInfo;
    }
    /**
     * getterではないパスの収集をする
     * getterとその子要素は対象としない
     * あわせて更新情報を作成する
     * getterの演算前に、状態を確定させる目的で使用する
     * @param ref
     * @param node
     * @param updateInfo
     * @param isSource
     * @returns
     */
    recursiveCollectUpdates(engine, state, ref, node, updateInfo, visitedRefs, isSource) {
        if (visitedRefs.has(ref))
            return;
        visitedRefs.add(ref);
        let diff = null;
        if (engine.pathManager.lists.has(ref.info.pattern)) {
            const { list: oldValue, listIndexes: oldIndexes } = this.getOldListAndListIndexes(engine, updateInfo, ref);
            // ToDo:直接getByRefWritableをコールして最適化する
            const newValue = state[GetByRefSymbol](ref);
            const parentListIndex = ref.listIndex;
            if (isSource) {
                // リスト差分取得
                diff = calcListDiff(parentListIndex, oldValue, newValue ?? [], oldIndexes);
            }
            else {
                // リストはすべて新規
                diff = {
                    adds: undefined,
                    oldListValue: null,
                    newListValue: newValue,
                    oldIndexes: [],
                    newIndexes: [],
                };
                for (let i = 0; i < (newValue?.length ?? 0); i++) {
                    const newListIndex = createListIndex(parentListIndex, 0);
                    diff.newIndexes.push(newListIndex);
                }
                diff.adds = new Set(diff.newIndexes);
            }
            engine.saveListAndListIndexes(ref, newValue, diff.newIndexes);
            updateInfo.listDiffByRef.set(ref, diff);
        }
        // 子ノードを再帰的に処理
        for (const [name, childNode] of node.childNodeByName.entries()) {
            if (engine.pathManager.getters.has(childNode.currentPath)) {
                // getterの要素は対象外
                continue;
            }
            const childInfo = getStructuredPathInfo(childNode.currentPath);
            if (name !== WILDCARD) {
                const childRef = getStatePropertyRef(childInfo, ref.listIndex);
                this.recursiveCollectUpdates(engine, state, childRef, childNode, updateInfo, visitedRefs, false);
            }
            else {
                if (diff === null) {
                    raiseError({
                        code: "UPD-002",
                        message: "Wildcard processing not implemented",
                        docsUrl: "./docs/error-codes.md#upd",
                    });
                }
                for (let childIndex of (diff?.adds ?? [])) {
                    const childRef = getStatePropertyRef(childInfo, childIndex);
                    this.recursiveCollectUpdates(engine, state, childRef, childNode, updateInfo, visitedRefs, false);
                }
            }
        }
    }
    recursiveCollectGetterUpdates(engine, state, ref, node, updateInfo, collectRefs, visitedRefs, isSource) {
        if (visitedRefs.has(ref))
            return;
        visitedRefs.add(ref);
        let diff = null;
        let newValue = undefined;
        let isSetNewValue = false;
        if (!collectRefs.has(ref)) {
            // 
            if (engine.pathManager.lists.has(ref.info.pattern)) {
                diff = updateInfo.listDiffByRef?.get(ref) ?? null;
                if (diff === null) {
                    const { list: oldValue, listIndexes: oldIndexes } = this.getOldListAndListIndexes(engine, updateInfo, ref);
                    // ToDo:直接getByRefWritableをコールして最適化する
                    newValue = state[GetByRefSymbol](ref);
                    isSetNewValue = true;
                    const parentListIndex = ref.listIndex;
                    diff = calcListDiff(parentListIndex, oldValue, newValue ?? [], oldIndexes);
                    engine.saveListAndListIndexes(ref, newValue, diff.newIndexes);
                    updateInfo.listDiffByRef.set(ref, diff);
                }
            }
        }
        else {
            if (engine.pathManager.lists.has(ref.info.pattern)) {
                diff = updateInfo.listDiffByRef.get(ref) ?? null;
            }
        }
        /*
            if (engine.pathManager.getters.has(ref.info.pattern)) {
              if (!isSetNewValue) {
                newValue = state[GetByRefSymbol](ref);
                isSetNewValue = true;
              }
              updateInfo.cacheValueByRef.set(ref, newValue);
            }
        */
        // 子ノードを再帰的に処理
        for (const [name, childNode] of node.childNodeByName.entries()) {
            const childInfo = getStructuredPathInfo(childNode.currentPath);
            if (name !== WILDCARD) {
                const childRef = getStatePropertyRef(childInfo, ref.listIndex);
                this.recursiveCollectGetterUpdates(engine, state, childRef, childNode, updateInfo, collectRefs, visitedRefs, false);
            }
            else {
                if (diff === null) {
                    raiseError({
                        code: "UPD-002",
                        message: "Wildcard processing not implemented",
                        docsUrl: "./docs/error-codes.md#upd",
                    });
                }
                for (let childIndex of (diff?.adds ?? [])) {
                    const childRef = getStatePropertyRef(childInfo, childIndex);
                    this.recursiveCollectGetterUpdates(engine, state, childRef, childNode, updateInfo, collectRefs, visitedRefs, false);
                }
            }
        }
        // 依存関係を再帰的に処理
        for (const depPath of engine.pathManager.dynamicDependencies.get(ref.info.pattern) ?? []) {
            const depInfo = getStructuredPathInfo(depPath);
            const depNode = findPathNodeByPath(engine.pathManager.rootNode, depPath);
            if (depNode === null) {
                raiseError({
                    code: "UPD-004",
                    message: `Path node not found for dependency: ${depPath}`,
                    docsUrl: "./docs/error-codes.md#upd",
                });
            }
            if (depInfo.wildcardCount === 0) {
                const depRef = getStatePropertyRef(depInfo, null);
                this.recursiveCollectGetterUpdates(engine, state, depRef, depNode, updateInfo, collectRefs, visitedRefs, false);
            }
            else {
                const matchPathSet = ref.info.wildcardParentPathSet.intersection(depInfo.wildcardParentPathSet);
                const matchCount = matchPathSet.size;
                if (matchCount >= depInfo.wildcardCount) {
                    const depListIndex = ref.listIndex?.at(depInfo.wildcardCount - 1) ?? raiseError({
                        code: "UPD-005",
                        message: `ListIndex not found for dependency: ${depPath}`,
                    });
                    const depRef = getStatePropertyRef(depInfo, depListIndex);
                    this.recursiveCollectGetterUpdates(engine, state, depRef, depNode, updateInfo, collectRefs, visitedRefs, false);
                }
                else {
                    const walk = (parentListIndex, pathIndex, wildcardParentPaths) => {
                        if (pathIndex <= wildcardParentPaths.length - 1) {
                            const wildcardParentPath = wildcardParentPaths[pathIndex];
                            const wildcardParentInfo = getStructuredPathInfo(wildcardParentPath);
                            const wildcardRef = getStatePropertyRef(wildcardParentInfo, parentListIndex);
                            const wildcardListIndexes = engine.getListAndListIndexes(wildcardRef)?.listIndexes ?? [];
                            for (const wildcardListIndex of wildcardListIndexes) {
                                walk(wildcardListIndex, pathIndex + 1, wildcardParentPaths);
                            }
                        }
                        else {
                            const depRef = getStatePropertyRef(depInfo, parentListIndex);
                            this.recursiveCollectGetterUpdates(engine, state, depRef, depNode, updateInfo, collectRefs, visitedRefs, false);
                        }
                    };
                    const parentListIndex = ref.listIndex?.at(matchCount - 1) ?? null;
                    const pathIndex = matchCount;
                    const wildcardParentPaths = depInfo.wildcardParentPaths;
                    walk(parentListIndex, pathIndex, wildcardParentPaths);
                }
            }
        }
    }
    prepareRender(engine, state, updateInfo, ref) {
        const node = findPathNodeByPath(this.#engine.pathManager.rootNode, ref.info.pattern);
        if (node === null) {
            raiseError({
                code: "UPD-003",
                message: `Path node not found for pattern: ${ref.info.pattern}`,
                docsUrl: "./docs/error-codes.md#upd",
            });
        }
        const collectRefs = new Set();
        this.recursiveCollectUpdates(engine, state, ref, node, updateInfo, collectRefs, true);
        const collectGetterRefs = new Set();
        this.recursiveCollectGetterUpdates(engine, state, ref, node, updateInfo, collectRefs, collectGetterRefs, true);
        updateInfo.updatedRefs = updateInfo.updatedRefs.union(collectRefs).union(collectGetterRefs);
    }
}
export async function update(engine, loopContext, callback) {
    const updater = new Updater(engine);
    await updater.beginUpdate(loopContext, async (state, handler) => {
        await callback(updater, state, handler);
    });
}
