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
 * Updaterクラスは、状態管理と更新の中心的な役割を果たします。
 * 状態更新が必要な場合に、都度インスタンスを作成して使用します。
 * 主な機能は以下の通りです:
 */
class Updater implements IUpdater {
  queue: IStatePropertyRef[] = [];
  #rendering: boolean = false;
  #engine: IComponentEngine;

  #version: number;
  #revision: number = 0;
  #listDiffByRef: WeakMap<IStatePropertyRef, IListDiff> = new WeakMap();
  #oldValueAndIndexesByRef: WeakMap<IStatePropertyRef, ISaveInfoByResolvedPathInfo> = new WeakMap();
  #revisionByUpdatedPath: Map<string, number> = new Map();

  constructor(engine: IComponentEngine) {
    this.#engine = engine;
    this.#version = engine.versionUp();
  }

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

  /**
   * リストの元の値とインデックス情報を取得
   * @param ref
   * @returns 
   */
  getOldValueAndIndexes(ref: IStatePropertyRef): ISaveInfoByResolvedPathInfo | undefined {
    let saveInfo = this.#oldValueAndIndexesByRef.get(ref);
    if (typeof saveInfo === "undefined") {
      saveInfo = this.#engine.getListAndListIndexes(ref);
    }
    return saveInfo;
  }

  /**
   * リスト差分を計算し、必要に応じて保存する
   * @param ref 
   * @param newValue 
   * @returns 
   */
  calcListDiff(ref: IStatePropertyRef, newValue:any): boolean {
    const curDiff = this.#listDiffByRef.get(ref);
    if (typeof curDiff !== "undefined") {
      // すでに計算結果がある場合は、変更があるか計算する
      const diff = calcListDiff(ref.listIndex, curDiff.newListValue, newValue, curDiff.newIndexes);
      if (diff.same) {
        return false;
      }
      // 変更がある場合、以降の処理で元のリストと差分情報を計算し直す
    }
    // 元のリストとインデックス情報を取得して差分計算
    const saveInfo = this.getOldValueAndIndexes(ref);
    const diff = calcListDiff(ref.listIndex, saveInfo?.list, newValue, saveInfo?.listIndexes);
    // 差分を保存、diff.sameに関わらず差分結果を保存(リストが初期化の場合など差分結果なしはまずいので)
    this.#listDiffByRef.set(ref, diff);
    if (diff.same) {
      return false;
    }
    // 差分がある場合は保存処理を行う
    this.#engine.saveListAndListIndexes(ref, diff.newListValue ?? null, diff.newIndexes);
    this.#oldValueAndIndexesByRef.set(ref, saveInfo ?? { list:null, listIndexes: null, listClone: null });
    return true;
  }

  /**
   * リスト差分結果を取得
   * @param ref 
   * @returns 
   */
  getListDiff(ref: IStatePropertyRef): IListDiff | undefined {
    return this.#listDiffByRef.get(ref);
  }

  /**
   * 更新したRefをキューに追加し、レンダリングをスケジュールする
   * @param ref 
   * @returns 
   */
  enqueueRef(ref: IStatePropertyRef): void {
    this.#revision++;
    this.queue.push(ref);
    this.collectMaybeUpdates(this.#engine, ref.info.pattern, this.#revisionByUpdatedPath, this.#revision);
    // レンダリング中はスキップ
    if (this.#rendering) return;
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
  async update(loopContext: ILoopContext | null, callback: UpdateCallback): Promise<void> {
    await useWritableStateProxy(this.#engine, this, this.#engine.state, loopContext, async (state:IWritableStateProxy, handler:IWritableStateHandler) => {
      // 状態更新処理
      await callback(state, handler);
    });
  }

  /**
   * リードオンリーな状態を生成し、コールバックに渡す
   * @param callback 
   * @returns 
   */
  createReadonlyState(callback: ReadonlyStateCallback): any {
    const handler = createReadonlyStateHandler(this.#engine, this);
    const stateProxy = createReadonlyStateProxy(this.#engine.state, handler);
    return callback(stateProxy, handler);
  }

  /**
   * レンダリング処理
   */
  rendering(): void {
    try {
      while( this.queue.length > 0 ) {
        // キュー取得
        const queue = this.queue;
        this.queue = [];
        // レンダリング実行
        render(queue, this.#engine, this);
      }
    } finally {
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
  recursiveCollectMaybeUpdates(
    engine: IComponentEngine,
    path: string,
    node: IPathNode,
    visitedInfo: Set<string>,
    isSource: boolean
  ): void {
    if (visitedInfo.has(path)) return;
    // swapの場合スキップしたい
    if (isSource && engine.pathManager.elements.has(path)) {
      return;

    }
    visitedInfo.add(path);

    for(const [name, childNode] of node.childNodeByName.entries()) {
      const childPath = childNode.currentPath;
      this.recursiveCollectMaybeUpdates(engine, childPath, childNode, visitedInfo, false);
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
      this.recursiveCollectMaybeUpdates(engine, depPath, depNode, visitedInfo, false);
    }
  }

  #cacheUpdatedPathsByPath: Map<string, Set<string>> = new Map();
  collectMaybeUpdates(engine: IComponentEngine, path: string, revisionByUpdatedPath: Map<string, number>, revision: number): void {
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
      updatedPaths = new Set<string>();
      this.recursiveCollectMaybeUpdates(engine, path, node, updatedPaths, true);
    }
    for(const updatedPath of updatedPaths) {
      revisionByUpdatedPath.set(updatedPath, revision);
    }
    this.#cacheUpdatedPathsByPath.set(path, updatedPaths);
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