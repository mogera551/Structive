import { calcListDiff } from "../ListDiff/ListDiff";
import { findPathNodeByPath } from "../PathTree/PathNode";
import { createReadonlyStateHandler, createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy";
import { useWritableStateProxy } from "../StateClass/useWritableStateProxy";
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
    #version;
    #revision = 0;
    #listDiffByRef = new WeakMap();
    #oldValueAndIndexesByRef = new WeakMap();
    #revisionByUpdatedPath = new Map();
    get revisionByUpdatedPath() {
        return this.#revisionByUpdatedPath;
    }
    get listDiffByRef() {
        return this.#listDiffByRef;
    }
    get version() {
        return this.#version;
    }
    get revision() {
        return this.#revision;
    }
    getOldValueAndIndexes(ref) {
        let saveInfo = this.#oldValueAndIndexesByRef.get(ref);
        if (typeof saveInfo === "undefined") {
            saveInfo = this.#engine.getListAndListIndexes(ref);
        }
        return saveInfo;
    }
    calcListDiff(ref, newValue) {
        const curDiff = this.#listDiffByRef.get(ref);
        if (typeof curDiff !== "undefined") {
            const diff = calcListDiff(ref.listIndex, curDiff.newListValue, newValue, curDiff.newIndexes);
            if (diff.same) {
                return false;
            }
        }
        const saveInfo = this.getOldValueAndIndexes(ref);
        const diff = calcListDiff(ref.listIndex, saveInfo?.list, newValue, saveInfo?.listIndexes);
        if (diff.same) {
            this.#listDiffByRef.set(ref, diff);
            return false;
        }
        this.#listDiffByRef.set(ref, diff);
        this.#engine.saveListAndListIndexes(ref, diff.newListValue ?? null, diff.newIndexes);
        this.#oldValueAndIndexesByRef.set(ref, saveInfo ?? { list: null, listIndexes: null, listClone: null });
        return true;
    }
    getListDiff(ref) {
        return this.#listDiffByRef.get(ref);
    }
    constructor(engine) {
        this.#engine = engine;
        this.#version = engine.versionUp();
    }
    get state() {
        if (!this.#state)
            throw new Error("State not initialized");
        return this.#state;
    }
    // Ref情報をキューに追加
    enqueueRef(ref) {
        this.#revision++;
        this.queue.push(ref);
        this.collectMaybeUpdates(this.#engine, ref.info.pattern, this.#revisionByUpdatedPath, this.#revision);
        if (this.#rendering)
            return;
        this.#rendering = true;
        queueMicrotask(() => {
            this.rendering();
        });
    }
    // 状態更新開始
    async update(loopContext, callback) {
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
    createReadonlyState(callback) {
        const handler = createReadonlyStateHandler(this.#engine, this);
        const stateProxy = createReadonlyStateProxy(this.#engine.state, handler);
        return callback(stateProxy, handler);
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
                render(queue, this.#engine, this);
            }
        }
        finally {
            this.#rendering = false;
        }
    }
    recursiveCollectMaybeUpdates(engine, path, node, revisionByUpdatedPath, revision, visitedInfo) {
        if (visitedInfo.has(path))
            return;
        visitedInfo.add(path);
        revisionByUpdatedPath.set(path, revision);
        for (const [name, childNode] of node.childNodeByName.entries()) {
            const childPath = childNode.currentPath;
            this.recursiveCollectMaybeUpdates(engine, childPath, childNode, revisionByUpdatedPath, revision, visitedInfo);
        }
        const deps = engine.pathManager.dynamicDependencies.get(path) ?? [];
        for (const depPath of deps) {
            const depNode = findPathNodeByPath(engine.pathManager.rootNode, depPath);
            if (depNode === null) {
                raiseError({
                    code: "UPD-004",
                    message: `Path node not found for pattern: ${depPath}`,
                    docsUrl: "./docs/error-codes.md#upd",
                });
            }
            this.recursiveCollectMaybeUpdates(engine, depPath, depNode, revisionByUpdatedPath, revision, visitedInfo);
        }
    }
    collectMaybeUpdates(engine, path, revisionByUpdatePath, revision) {
        const node = findPathNodeByPath(engine.pathManager.rootNode, path);
        if (node === null) {
            raiseError({
                code: "UPD-003",
                message: `Path node not found for pattern: ${path}`,
                docsUrl: "./docs/error-codes.md#upd",
            });
        }
        this.recursiveCollectMaybeUpdates(engine, path, node, revisionByUpdatePath, revision, new Set());
    }
}
/**
 * Updaterを生成しコールバックに渡す
 * スコープを明確にするための関数
 * @param engine
 * @param callback
 */
export function createUpdater(engine, callback) {
    const updater = new Updater(engine);
    return callback(updater);
}
