import { IComponentEngine } from "../ComponentEngine/types";
import { WILDCARD } from "../constants";
import { calcListDiff } from "../ListDiff/ListDiff";
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
import { IUpdater } from "./types";


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

  constructor(engine: IComponentEngine) {
    this.#engine = engine;
  }

  // Ref情報をキューに追加
  enqueueRef(ref: IStatePropertyRef): void {
    this.queue.push(ref);
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

  /**
   * getterではないパスの収集をする
   * getterとその子要素は対象としない
   * あわせて更新情報を作成する
   * getterの演算前に、状態を確定させる目的で使用する
   * @param ref 
   * @param node 
   * @param renderInfo 
   * @param isSource 
   * @returns 
   */
  recursiveCollectUpdates(
    engine: IComponentEngine,
    state: IStateProxy,
    ref: IStatePropertyRef, 
    node: IPathNode, 
    renderInfo: any, 
    isSource: boolean
  ): void {
    if (renderInfo.staticVisited.has(ref)) return;
    renderInfo.staticVisited.add(ref);

    let addIndexes: IListIndex[] | null = null;
    if(this.#engine.pathManager.lists.has(ref.info.pattern)) {
      // ToDo:直接getByRefWritableをコールして最適化する
      const lists = renderInfo.oldValueAndIndexesByRef.get(ref);
      let oldValue: any[];
      let oldIndexes: IListIndex[] | null;
      if (typeof lists !== "undefined") {
        [ oldValue, oldIndexes ] = lists;
      } else {
        const { list, listIndexes } = engine.getListAndListIndexes(ref);
        oldValue = list ?? [];
        oldIndexes = listIndexes;
        renderInfo.oldValueAndIndexesByRef.set(ref, [ oldValue, oldIndexes ]);
      }
      const newValue = state[GetByRefSymbol](ref);
      const parentListIndex = ref.listIndex?.parentListIndex ?? null;
      if (isSource) {
        // リスト差分取得
        const diff = calcListDiff(parentListIndex, oldValue, newValue ?? [], oldIndexes);
        addIndexes = Array.from(diff.adds ?? []);
      } else {
        // リストはすべて新規
        addIndexes = [];
        for(let i = 0; i < (newValue?.length ?? 0); i++) {
          const newListIndex = createListIndex(parentListIndex, 0);
          addIndexes.push(newListIndex);
        }
      }
    }

    // 子ノードを再帰的に処理
    for(const [name, childNode] of node.childNodeByName.entries()) {
      if (engine.pathManager.getters.has(childNode.currentPath)) {
        // getterの子要素は対象外
        continue;
      }

      const childInfo = getStructuredPathInfo(childNode.currentPath);
      if (name !== WILDCARD) {
        const childRef = getStatePropertyRef(childInfo, ref.listIndex);
        this.recursiveCollectUpdates(engine, state, childRef, childNode, renderInfo, false);
      } else {
        if (addIndexes === null) {
          raiseError({
            code: "UPD-002",
            message: "Wildcard processing not implemented",
            docsUrl: "./docs/error-codes.md#upd",
          });
        }
        for(let i = 0; i < addIndexes.length; i++) {
          const childIndex = addIndexes[i];
          const childRef = getStatePropertyRef(childInfo, childIndex);
          this.recursiveCollectUpdates(engine, state, childRef, childNode, renderInfo, false);
        }
      }
    }

  }

  prepareRender(engine: IComponentEngine, state: IStateProxy, ref: IStatePropertyRef): void {
    const renderInfo = {
      staticVisited: new Set<IStatePropertyRef>(),
      dynamicDependencyEntryPoints: new Set<IStatePropertyRef>(),
      /** */
      cacheValueByRef: new Map<IStatePropertyRef, any>(),
      oldValueAndIndexesByRef: new Map<IStatePropertyRef, [ any[], IListIndex[] | null ]>(),
    };
    const node = findPathNodeByPath(this.#engine.pathManager.rootNode, ref.info.pattern);
    if (node === null) {
      raiseError({
        code: "UPD-003",
        message: `Path node not found for pattern: ${ref.info.pattern}`,
        docsUrl: "./docs/error-codes.md#upd",
      });
    }
    this.recursiveCollectUpdates(engine, state, ref, node, renderInfo, true);
  }
}


export async function update(engine: IComponentEngine, loopContext: ILoopContext | null, callback: (updater: IUpdater, state: IWritableStateProxy, handler: IWritableStateHandler) => Promise<void>): Promise<void> {
  const updater = new Updater(engine);
  await updater.beginUpdate(loopContext, async (state, handler) => {
    await callback(updater, state, handler);
  });
}