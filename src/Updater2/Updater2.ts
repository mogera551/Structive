import { IComponentEngine } from "../ComponentEngine/types";
import { IBinding } from "../DataBinding/types";
import { createListIndex2 } from "../ListIndex2/ListIndex2";
import { IListIndex2 } from "../ListIndex2/types";
import { ILoopContext } from "../LoopContext/types";
import { createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy";
import { IReadonlyStateProxy, IWritableStateProxy } from "../StateClass/types";
import { useWritableStateProxy } from "../StateClass/useWritableStateProxy";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { raiseError } from "../utils";
import { IListIndexResults, IUpdateInfo, IUpdater2 } from "./types";


/**
 * Updater2クラスは、状態管理と更新の中心的な役割を果たします。
 * 状態更新が必要な場合に、都度インスタンスを作成して使用します。
 * 主な機能は以下の通りです:
 */
class Updater2 implements IUpdater2 {
  queue: Array<IUpdateInfo> = [];
  #updating: boolean = false;
  #rendering: boolean = false;
  #readonlyState: IReadonlyStateProxy | null = null;
  
  // Ref情報をキューに追加
  enqueueRef(info: IStructuredPathInfo, listIndex: IListIndex2 | null, value: any): void {
    this.queue.push({ info, listIndex, value });
    if (this.#rendering) return;
    this.#rendering = true;
    queueMicrotask(() => {
      this.rendering();
    });
  }
  // 状態更新開始
  async beginUpdate(engine: IComponentEngine, state: object, loopContext: ILoopContext | null, callback: (state: IWritableStateProxy) => Promise<void>): Promise<void> {
    try {
      this.#updating = true;
      this.#readonlyState = createReadonlyStateProxy(engine, state);
      await useWritableStateProxy(engine, state, loopContext, async (state:IWritableStateProxy) => {
        // 状態更新処理
        await callback(state);
      });
    } finally {
      this.#updating = false;
    }
  }
  // レンダリング
  rendering(): void {
    try {
      while( this.queue.length > 0 ) {
        // レンダリング処理
        const queue = this.queue;
        this.queue = [];
        // 各キューに対してレンダリング処理を実行
        this.renderItems(queue);
      }
    } finally {
      this.#rendering = false;
    }
  }

  renderItems(items: Array<IUpdateInfo>): void {
    // 実際のレンダリングロジックをここに実装
    if (!this.#readonlyState) raiseError("Readonly state is not initialized.");
    // 更新したバインディングを保存しておく
    const updatedBindings: Set<IBinding> = new Set();
  }

  isListValue(info: IStructuredPathInfo): boolean {
    return true; // 仮実装、実際にはinfoを解析してリストかどうかを判断
  }

  getOldListIndexesSet(info: IStructuredPathInfo, listIndex: IListIndex2 | null): Set<IListIndex2> | null {
    // 仮実装、実際にはエンジンから古いリストインデックスセットを取得
    return new Set<IListIndex2>();
  }

  getOldValue(info: IStructuredPathInfo, listIndex: IListIndex2 | null): any[] | null {
    // 仮実装、実際にはエンジンから古い値を取得
    return [];
  }

  getBindings(info: IStructuredPathInfo, listIndex: IListIndex2 | null): Set<IBinding> {
    // 仮実装、実際にはエンジンからバインディングを取得
    return new Set<IBinding>();
  }

  renderItem(item: IUpdateInfo, updatedBindings: Set<IBinding>, readonlyState: IReadonlyStateProxy): void {
    // 単一のレンダリングロジックをここに実装
    if (this.isListValue(item.info)) {
      // リストの場合の処理
      const oldListIndexesSet = this.getOldListIndexesSet(item.info, item.listIndex);
      const oldValue = this.getOldValue(item.info, item.listIndex);
      const diffResults = this.listDiff(oldValue, oldListIndexesSet, item.value, item.listIndex);
    } else {
      // 単一値の場合の処理
      this.getBindings(item.info, item.listIndex).forEach(binding => {
        updatedBindings.add(binding);
      });
    }
  }

  listDiffNew(
    newValue: any[],
    parentListIndex: IListIndex2 | null,
  ): IListIndexResults {
    const adds: Set<IListIndex2> = new Set();
    const newListIndexesSet: Set<IListIndex2> = new Set();
    for(let i = 0; i < newValue.length; i++) {
      // リスト要素から古いリストインデックスを取得して、リストインデックスを更新する
      // もし古いリストインデックスがなければ、新しいリストインデックスを作成する
      const newListIndex = createListIndex2(parentListIndex, i);
      adds.add(newListIndex);
      newListIndexesSet.add(newListIndex);
    }
    return { adds, newListIndexesSet };
  }

  listDiffUpdate(
    oldValue: any[], 
    oldListIndexesSet: Set<IListIndex2>,
    newValue: any[],
    parentListIndex: IListIndex2 | null,
  ): IListIndexResults {
    const adds: Set<IListIndex2> = new Set();
    const updates: Set<IListIndex2> = new Set();
    // 新しいリスト要素に基づいて、リストインデックスを再構築する
    const newListIndexesSet:Set<IListIndex2> = new Set();
    const oldListIndexesByValue = Map.groupBy(oldListIndexesSet, listIndex => oldValue[listIndex.index]);
    for(let i = 0; i < newValue.length; i++) {
      // リスト要素から古いリストインデックスを取得して、リストインデックスを更新する
      // もし古いリストインデックスがなければ、新しいリストインデックスを作成する
      const lastListIndex = oldListIndexesByValue.get(newValue[i])?.shift();
      if (lastListIndex) {
        if (lastListIndex.index !== i) {
          lastListIndex.index = i;
          updates.add(lastListIndex);
        }
        newListIndexesSet.add(lastListIndex);
      } else {
        const newListIndex = createListIndex2(parentListIndex, i);
        adds.add(newListIndex);
        newListIndexesSet.add(newListIndex);
      }
    }
    const removes: Set<IListIndex2> = oldListIndexesSet.difference(newListIndexesSet);
    return { adds, updates, removes, newListIndexesSet}
  }

  listDiff(
    oldValue: any[] | undefined | null,
    oldListIndexesSet: Set<IListIndex2> | undefined | null,
    newValue: any[] | undefined | null,
    parentListIndex: IListIndex2 | null,
  ): IListIndexResults {
    if (oldValue != null && newValue != null) {
      if (!oldListIndexesSet) raiseError("Old list indexes set is not provided for existing old value.");
      if (oldValue.length > 0 && newValue.length > 0) {
        return this.listDiffUpdate(oldValue, oldListIndexesSet, newValue, parentListIndex);
      } else if (newValue.length > 0) {
        return this.listDiffNew(newValue, parentListIndex);
      } else { // oldValue.length > 0
        const removes: Set<IListIndex2> = oldListIndexesSet ? new Set(oldListIndexesSet) : new Set();
        return { removes };
      }
    } else if (newValue != null) {
      return this.listDiffNew(newValue, parentListIndex);
    } else { // oldValue != null
      const removes: Set<IListIndex2> = oldListIndexesSet ? new Set(oldListIndexesSet) : new Set();
      return { removes };
    }
  }
}