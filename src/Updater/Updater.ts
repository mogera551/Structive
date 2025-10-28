import { IComponentEngine, ISaveInfoByResolvedPathInfo } from "../ComponentEngine/types";
import { WILDCARD } from "../constants";
import { calcListDiff } from "../ListDiff/ListDiff";
import { IListDiff } from "../ListDiff/types";
import { createListIndex } from "../ListIndex/ListIndex";
import { IListIndex } from "../ListIndex/types";
import { ILoopContext } from "../LoopContext/types";
import { findPathNodeByPath } from "../PathTree/PathNode";
import { IPathNode } from "../PathTree/types";
import { createReadonlyStateHandler, createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy";
import { getByRefWritable } from "../StateClass/methods/getByRefWritable";
import { GetByRefSymbol } from "../StateClass/symbols";
import { IStateProxy, IWritableStateHandler, IWritableStateProxy } from "../StateClass/types";
import { useWritableStateProxy } from "../StateClass/useWritableStateProxy";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { raiseError } from "../utils";
import { render } from "./Renderer";
import { IUpdateInfo, IUpdater, ReadonlyStateCallback, UpdateCallback } from "./types";


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
  #updateInfo: IUpdateInfo;

  #version: number;
  #revision: number = 0;
  #cacheValueByRef: WeakMap<IStatePropertyRef, any> = new WeakMap();
  #listDiffByRef: WeakMap<IStatePropertyRef, IListDiff> = new WeakMap();
  #oldValueAndIndexesByRef: WeakMap<IStatePropertyRef, ISaveInfoByResolvedPathInfo> = new WeakMap();
  #revisionByUpdatedPath: Map<string, number> = new Map();

  get revisionByUpdatedPath(): Map<string, number> {
    return this.#revisionByUpdatedPath;
  }

  get version(): number {
    return this.#version;
  }

  get revision(): number {
    return this.#revision;
  }

  constructor(engine: IComponentEngine) {
    this.#engine = engine;
    this.#version = engine.versionUp();
    this.#updateInfo = {
      updatedRefs: new Set<IStatePropertyRef>(),
      cacheValueByRef: new Map<IStatePropertyRef, any>(),
      oldValueAndIndexesByRef: new Map<IStatePropertyRef, ISaveInfoByResolvedPathInfo>(),
      listDiffByRef: new Map<IStatePropertyRef, IListDiff>(),
    };
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

  getOldListAndListIndexes(
    engine: IComponentEngine,
    updateInfo: IUpdateInfo, 
    ref: IStatePropertyRef
  ): ISaveInfoByResolvedPathInfo {
    let saveInfo = updateInfo.oldValueAndIndexesByRef.get(ref);
    if (typeof saveInfo === "undefined") {
      saveInfo = engine.getListAndListIndexes(ref);
      updateInfo.oldValueAndIndexesByRef.set(ref, saveInfo);
    }
    return saveInfo;
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