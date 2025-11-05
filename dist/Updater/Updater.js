import { findPathNodeByPath } from "../PathTree/PathNode";
import { createReadonlyStateHandler, createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy";
import { useWritableStateProxy } from "../StateClass/useWritableStateProxy";
import { raiseError } from "../utils";
import { render } from "./Renderer";
/**
 * Updaterクラスは、状態管理と更新の中心的な役割を果たします。
 * 状態更新が必要な場合に、都度インスタンスを作成して使用します。
 * 主な機能は以下の通りです:
 */
class Updater {
    queue = [];
    #rendering = false;
    #engine;
    #version;
    #revision = 0;
    #swapInfoByRef = new Map();
    constructor(engine) {
        this.#engine = engine;
        this.#version = engine.versionUp();
    }
    get version() {
        return this.#version;
    }
    get revision() {
        return this.#revision;
    }
    get swapInfoByRef() {
        return this.#swapInfoByRef;
    }
    /**
     * 更新したRefをキューに追加し、レンダリングをスケジュールする
     * @param ref
     * @returns
     */
    enqueueRef(ref) {
        this.#revision++;
        this.queue.push(ref);
        this.collectMaybeUpdates(this.#engine, ref.info.pattern, this.#engine.versionRevisionByPath, this.#revision);
        // レンダリング中はスキップ
        if (this.#rendering)
            return;
        this.#rendering = true;
        queueMicrotask(() => {
            this.rendering();
        });
    }
    /**
     * 状態更新処理開始
     * @param loopContext
     * @param callback
     */
    async update(loopContext, callback) {
        await useWritableStateProxy(this.#engine, this, this.#engine.state, loopContext, async (state, handler) => {
            // 状態更新処理
            await callback(state, handler);
        });
    }
    /**
     * レンダリング処理
     */
    rendering() {
        try {
            while (this.queue.length > 0) {
                // キュー取得
                const queue = this.queue;
                this.queue = [];
                // レンダリング実行
                render(queue, this.#engine, this);
            }
        }
        finally {
            this.#rendering = false;
        }
    }
    /**
     * 更新したパスに対して影響があるパスを再帰的に収集する
     * @param engine
     * @param path
     * @param node
     * @param revisionByUpdatedPath
     * @param revision
     * @param visitedInfo
     * @returns
     */
    recursiveCollectMaybeUpdates(engine, path, node, visitedInfo, isSource) {
        if (visitedInfo.has(path))
            return;
        // swapの場合スキップしたい
        if (isSource && engine.pathManager.elements.has(path)) {
            return;
        }
        visitedInfo.add(path);
        for (const [name, childNode] of node.childNodeByName.entries()) {
            const childPath = childNode.currentPath;
            this.recursiveCollectMaybeUpdates(engine, childPath, childNode, visitedInfo, false);
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
            this.recursiveCollectMaybeUpdates(engine, depPath, depNode, visitedInfo, false);
        }
    }
    #cacheUpdatedPathsByPath = new Map();
    collectMaybeUpdates(engine, path, versionRevisionByPath, revision) {
        const node = findPathNodeByPath(engine.pathManager.rootNode, path);
        if (node === null) {
            raiseError({
                code: "UPD-003",
                message: `Path node not found for pattern: ${path}`,
                docsUrl: "./docs/error-codes.md#upd",
            });
        }
        // キャッシュ
        let updatedPaths = this.#cacheUpdatedPathsByPath.get(path);
        if (typeof updatedPaths === "undefined") {
            updatedPaths = new Set();
            this.recursiveCollectMaybeUpdates(engine, path, node, updatedPaths, true);
        }
        const versionRevision = {
            version: this.version,
            revision: revision,
        };
        for (const updatedPath of updatedPaths) {
            versionRevisionByPath.set(updatedPath, versionRevision);
        }
        this.#cacheUpdatedPathsByPath.set(path, updatedPaths);
    }
    /**
     * リードオンリーな状態を生成し、コールバックに渡す
     * @param callback
     * @returns
     */
    createReadonlyState(callback) {
        const handler = createReadonlyStateHandler(this.#engine, this, null);
        const stateProxy = createReadonlyStateProxy(this.#engine.state, handler);
        return callback(stateProxy, handler);
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
