import { IComponentEngine, ISaveInfoByResolvedPathInfo } from "../ComponentEngine/types";
import { calcListDiff } from "../ListDiff/ListDiff";
import { IListDiff } from "../ListDiff/types";
import { ILoopContext } from "../LoopContext/types";
import { findPathNodeByPath } from "../PathTree/PathNode";
import { IPathNode } from "../PathTree/types";
import { createReadonlyStateHandler, createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy";
import { IStateProxy, IWritableStateHandler, IWritableStateProxy } from "../StateClass/types";
import { useWritableStateProxy } from "../StateClass/useWritableStateProxy";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { raiseError } from "../utils";
import { render } from "./Renderer";
import { IUpdater, ReadonlyStateCallback, UpdateCallback } from "./types";


/**
 * Updater2クラスは、状態管理と更新の中心的な役割を果たします。
 * 状態更新が必要な場合に、都度インスタンスを作成して使用します。
 * 主な機能は以下の通りです:
 */
class Updater implements IUpdater {
  queue: IStatePropertyRef[] = [];
  #updating: boolean = false;
  #rendering: boolean = false;
  #engine: IComponentEngine;
  #state: IStateProxy | undefined = undefined;

  #version: number;
  #revision: number = 0;
  #listDiffByRef: WeakMap<IStatePropertyRef, IListDiff> = new WeakMap();
  #oldValueAndIndexesByRef: WeakMap<IStatePropertyRef, ISaveInfoByResolvedPathInfo> = new WeakMap();
  #revisionByUpdatedPath: Map<string, number> = new Map();

  get revisionByUpdatedPath(): Map<string, number> {
    return this.#revisionByUpdatedPath;
  }

  get listDiffByRef(): WeakMap<IStatePropertyRef, IListDiff> {
    return this.#listDiffByRef;
  }

  get version(): number {
    return this.#version;
  }

  get revision(): number {
    return this.#revision;
  }

  getOldValueAndIndexes(ref: IStatePropertyRef): ISaveInfoByResolvedPathInfo | undefined {
    let saveInfo = this.#oldValueAndIndexesByRef.get(ref);
    if (typeof saveInfo === "undefined") {
      saveInfo = this.#engine.getListAndListIndexes(ref);
    }
    return saveInfo;
  }

  calcListDiff(ref: IStatePropertyRef, newValue:any): boolean {
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
    this.#oldValueAndIndexesByRef.set(ref, saveInfo ?? { list:null, listIndexes: null, listClone: null });
    return true;
  }

  getListDiff(ref: IStatePropertyRef): IListDiff | undefined {
    return this.#listDiffByRef.get(ref);
  }

  constructor(engine: IComponentEngine) {
    this.#engine = engine;
    this.#version = engine.versionUp();
  }

  get state(): IStateProxy {  
    if (!this.#state) throw new Error("State not initialized");
    return this.#state;
  }

  // Ref情報をキューに追加
  enqueueRef(ref: IStatePropertyRef): void {
    this.#revision++;
    this.queue.push(ref);
    this.collectMaybeUpdates(this.#engine, ref.info.pattern, this.#revisionByUpdatedPath, this.#revision);
    if (this.#rendering) return;
    this.#rendering = true;
    queueMicrotask(() => {
      this.rendering();
    });
  }

  // 状態更新開始
  async update(loopContext: ILoopContext | null, callback: UpdateCallback): Promise<void> {
    try {
      this.#updating = true;
      await useWritableStateProxy(this.#engine, this, this.#engine.state, loopContext, async (state:IWritableStateProxy, handler:IWritableStateHandler) => {
        // 状態更新処理
        this.#state = state;
        await callback(state, handler);
      });
    } finally {
      this.#updating = false;
    }
  }

  createReadonlyState(callback: ReadonlyStateCallback): any {
    const handler = createReadonlyStateHandler(this.#engine, this);
    const stateProxy = createReadonlyStateProxy(this.#engine.state, handler);
    return callback(stateProxy, handler);
  }

  // レンダリング
  rendering(): void {
    try {
      while( this.queue.length > 0 ) {
        // キュー取得
        const queue = this.queue;
        this.queue = [];
        if (!this.#engine) raiseError({
          code: "UPD-001",
          message: "Engine not initialized",
          docsUrl: "./docs/error-codes.md#upd",
        });
        // レンダリング実行
        render(queue, this.#engine, this);
      }
    } finally {
      this.#rendering = false;
    }
  }

  recursiveCollectMaybeUpdates(
    engine: IComponentEngine,
    path: string,
    node: IPathNode,
    revisionByUpdatedPath: Map<string, number>,
    revision: number,
    visitedInfo: Set<string>,
  ): void {
    if (visitedInfo.has(path)) return;
    visitedInfo.add(path);
    revisionByUpdatedPath.set(path, revision);

    for(const [name, childNode] of node.childNodeByName.entries()) {
      const childPath = childNode.currentPath;
      this.recursiveCollectMaybeUpdates(engine, childPath, childNode, revisionByUpdatedPath, revision, visitedInfo);
    }

    const deps = engine.pathManager.dynamicDependencies.get(path) ?? [];
    for(const depPath of deps) {
      const depNode = findPathNodeByPath(engine.pathManager.rootNode, depPath);
      if (depNode === null) {
        raiseError({
          code: "UPD-004",
          message: `Path node not found for pattern: ${depPath}`,
          docsUrl: "./docs/error-codes.md#upd",
        });
      }
      this.recursiveCollectMaybeUpdates(engine, depPath
        , depNode, revisionByUpdatedPath, revision, visitedInfo);
    }
  }

  collectMaybeUpdates(engine: IComponentEngine, path: string, revisionByUpdatePath: Map<string, number>, revision: number): void {
    const node = findPathNodeByPath(engine.pathManager.rootNode, path);
    if (node === null) {
      raiseError({
        code: "UPD-003",
        message: `Path node not found for pattern: ${path}`,
        docsUrl: "./docs/error-codes.md#upd",
      });
    }
    this.recursiveCollectMaybeUpdates(engine, path, node, revisionByUpdatePath, revision, new Set<string>());
  }
}

/**
 * Updaterを生成しコールバックに渡す
 * スコープを明確にするための関数
 * @param engine 
 * @param callback 
 */
export function createUpdater(engine: IComponentEngine, callback: (updater: IUpdater) => Promise<void> | void): Promise<void> | void{
  const updater = new Updater(engine);
  return callback(updater);
}