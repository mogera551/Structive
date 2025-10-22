import { IComponentEngine, ISaveInfoByResolvedPathInfo } from "../ComponentEngine/types";
import { WILDCARD } from "../constants";
import { calcListDiff } from "../ListDiff/ListDiff";
import { IListDiff } from "../ListDiff/types";
import { createListIndex } from "../ListIndex/ListIndex";
import { IListIndex } from "../ListIndex/types";
import { ILoopContext } from "../LoopContext/types";
import { findPathNodeByPath } from "../PathTree/PathNode";
import { IPathNode } from "../PathTree/types";
import { getByRefWritable } from "../StateClass/methods/getByRefWritable";
import { GetByRefSymbol } from "../StateClass/symbols";
import { IStateProxy, IWritableStateHandler, IWritableStateProxy } from "../StateClass/types";
import { useWritableStateProxy } from "../StateClass/useWritableStateProxy";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { raiseError } from "../utils";
import { render } from "./Renderer";
import { IUpdateInfo, IUpdater } from "./types";


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

  constructor(engine: IComponentEngine) {
    this.#engine = engine;
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
    this.queue.push(ref);
    this.prepareRender(this.#engine, this.state, this.#updateInfo, ref);
    if (this.#rendering) return;
    this.#rendering = true;
    queueMicrotask(() => {
      this.rendering();
    });
  }

  // 状態更新開始
  async beginUpdate(loopContext: ILoopContext | null, callback: (state: IWritableStateProxy, handler: IWritableStateHandler) => Promise<void>): Promise<void> {
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
        render(queue, this.#engine);
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
  recursiveCollectUpdates(
    engine: IComponentEngine,
    state: IStateProxy,
    ref: IStatePropertyRef, 
    node: IPathNode, 
    updateInfo: IUpdateInfo, 
    visitedRefs: Set<IStatePropertyRef>,
    isSource: boolean
  ): void {
    if (visitedRefs.has(ref)) return;
    visitedRefs.add(ref);

    let diff: IListDiff | null = null;
    if (engine.pathManager.lists.has(ref.info.pattern)) {
      const { list:oldValue, listIndexes:oldIndexes } = this.getOldListAndListIndexes(engine, updateInfo, ref);
      // ToDo:直接getByRefWritableをコールして最適化する
      const newValue = state[GetByRefSymbol](ref);
      const parentListIndex = ref.listIndex?.parentListIndex ?? null;
      if (isSource) {
        // リスト差分取得
        diff = calcListDiff(parentListIndex, oldValue, newValue ?? [], oldIndexes);
      } else {
        // リストはすべて新規
        diff = {
          adds: undefined,
          oldListValue: null,
          newListValue: newValue,
          oldIndexes: [],
          newIndexes: [],
        }
        for(let i = 0; i < (newValue?.length ?? 0); i++) {
          const newListIndex = createListIndex(parentListIndex, 0);
          diff.newIndexes.push(newListIndex);
        }
        diff.adds = new Set<IListIndex>(diff.newIndexes);
      }
      updateInfo.listDiffByRef.set(ref, diff);
    }

    // 子ノードを再帰的に処理
    for(const [name, childNode] of node.childNodeByName.entries()) {
      if (engine.pathManager.getters.has(childNode.currentPath)) {
        // getterの要素は対象外
        continue;
      }

      const childInfo = getStructuredPathInfo(childNode.currentPath);
      if (name !== WILDCARD) {
        const childRef = getStatePropertyRef(childInfo, ref.listIndex);
        this.recursiveCollectUpdates(engine, state, childRef, childNode, updateInfo, visitedRefs, false);
      } else {
        if (diff === null) {
          raiseError({
            code: "UPD-002",
            message: "Wildcard processing not implemented",
            docsUrl: "./docs/error-codes.md#upd",
          });
        }
        for(let childIndex of (diff?.adds ?? [])) {
          const childRef = getStatePropertyRef(childInfo, childIndex);
          this.recursiveCollectUpdates(engine, state, childRef, childNode, updateInfo, visitedRefs, false);
        }
      }
    }

  }

  recursiveCollectGetterUpdates(
    engine: IComponentEngine,
    state: IStateProxy,
    ref: IStatePropertyRef, 
    node: IPathNode, 
    updateInfo: IUpdateInfo, 
    collectRefs: Set<IStatePropertyRef>,
    visitedRefs: Set<IStatePropertyRef>,
    isSource: boolean
  ): void {
    if (visitedRefs.has(ref)) return;
    visitedRefs.add(ref);

    let diff : IListDiff | null = null;
    let newValue : any = undefined;
    let isSetNewValue: boolean = false;
    if (!collectRefs.has(ref)) {
      // 
      if (engine.pathManager.lists.has(ref.info.pattern)) {
        diff = updateInfo.listDiffByRef?.get(ref) ?? null;
        if (diff === null) {
          const { list:oldValue, listIndexes:oldIndexes } = this.getOldListAndListIndexes(engine, updateInfo, ref);
          // ToDo:直接getByRefWritableをコールして最適化する
          newValue = state[GetByRefSymbol](ref);
          isSetNewValue = true;
          const parentListIndex = ref.listIndex?.parentListIndex ?? null;
          diff = calcListDiff(parentListIndex, oldValue, newValue ?? [], oldIndexes);
          updateInfo.listDiffByRef.set(ref, diff);
        }
      }
    } else {
      if (engine.pathManager.lists.has(ref.info.pattern)) {
        diff = updateInfo.listDiffByRef.get(ref) ?? null;
      }

    }
    if (engine.pathManager.getters.has(ref.info.pattern)) {
      if (!isSetNewValue) {
        newValue = state[GetByRefSymbol](ref);
        isSetNewValue = true;
      }
      updateInfo.cacheValueByRef.set(ref, newValue);
    }

    // 子ノードを再帰的に処理
    for(const [name, childNode] of node.childNodeByName.entries()) {
      const childInfo = getStructuredPathInfo(childNode.currentPath);
      if (name !== WILDCARD) {
        const childRef = getStatePropertyRef(childInfo, ref.listIndex);
        this.recursiveCollectGetterUpdates(engine, state, childRef, childNode, updateInfo, collectRefs, visitedRefs, false);
      } else {
        if (diff === null) {
          raiseError({
            code: "UPD-002",
            message: "Wildcard processing not implemented",
            docsUrl: "./docs/error-codes.md#upd",
          });
        }
        for(let childIndex of (diff?.adds ?? [])) {
          const childRef = getStatePropertyRef(childInfo, childIndex);
          this.recursiveCollectGetterUpdates(engine, state, childRef, childNode, updateInfo, collectRefs, visitedRefs, false);
        }
      }
    }

    // 依存関係を再帰的に処理
    for(const depPath of engine.pathManager.dynamicDependencies.get(ref.info.pattern) ?? []) {
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
      } else {
        const matchPathSet = ref.info.wildcardParentPathSet.intersection(depInfo.wildcardParentPathSet);
        const matchCount = matchPathSet.size;
        if (matchCount >= depInfo.wildcardCount) {
          const depListIndex = ref.listIndex?.at(depInfo.wildcardCount - 1) ?? raiseError({
            code: "UPD-005",
            message: `ListIndex not found for dependency: ${depPath}`,
          });
          const depRef = getStatePropertyRef(depInfo, depListIndex);
          this.recursiveCollectGetterUpdates(engine, state, depRef, depNode, updateInfo, collectRefs, visitedRefs, false);
        } else {
          const walk = (parentListIndex: IListIndex | null, pathIndex: number, wildcardParentPaths: string[]) => {
            if (pathIndex <= wildcardParentPaths.length - 1) {
              const wildcardParentPath = wildcardParentPaths[pathIndex];
              const wildcardParentInfo = getStructuredPathInfo(wildcardParentPath);
              const wildcardRef = getStatePropertyRef(wildcardParentInfo, parentListIndex);
              // ToDo:過去インデックスではだめ
              const wildcardListIndexes = this.getOldListAndListIndexes(engine, updateInfo, wildcardRef)?.listIndexes ?? [];
              for(const wildcardListIndex of wildcardListIndexes) {
                walk(wildcardListIndex, pathIndex + 1, wildcardParentPaths);
              }
            } else {
              const depRef = getStatePropertyRef(depInfo, parentListIndex);
              this.recursiveCollectGetterUpdates(engine, state, depRef, depNode, updateInfo, collectRefs, visitedRefs, false);
            }
          }
          const parentListIndex = ref.listIndex?.at(matchCount - 1) ?? null;
          const pathIndex = matchCount;
          const wildcardParentPaths = depInfo.wildcardParentPaths;
          walk(parentListIndex, pathIndex, wildcardParentPaths);
        }
      }
    }
  }

  prepareRender(engine: IComponentEngine, state: IStateProxy, updateInfo: IUpdateInfo, ref: IStatePropertyRef): void {
    const node = findPathNodeByPath(this.#engine.pathManager.rootNode, ref.info.pattern);
    if (node === null) {
      raiseError({
        code: "UPD-003",
        message: `Path node not found for pattern: ${ref.info.pattern}`,
        docsUrl: "./docs/error-codes.md#upd",
      });
    }
    const collectRefs = new Set<IStatePropertyRef>();
    this.recursiveCollectUpdates(engine, state, ref, node, updateInfo, collectRefs, true);
    const collectGetterRefs = new Set<IStatePropertyRef>();
    this.recursiveCollectGetterUpdates(engine, state, ref, node, updateInfo, collectRefs, collectGetterRefs, true);
    updateInfo.updatedRefs = updateInfo.updatedRefs.union(collectRefs).union(collectGetterRefs);
  }
}


export async function update(engine: IComponentEngine, loopContext: ILoopContext | null, callback: (updater: IUpdater, state: IWritableStateProxy, handler: IWritableStateHandler) => Promise<void>): Promise<void> {
  const updater = new Updater(engine);
  await updater.beginUpdate(loopContext, async (state, handler) => {
    await callback(updater, state, handler);
  });
}