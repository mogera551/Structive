import { IComponentEngine } from "../ComponentEngine/types";
import { IBinding } from "../DataBinding/types";
import { createListIndex2 } from "../ListIndex/ListIndex";
import { IListIndex } from "../ListIndex/types";
import { ILoopContext } from "../LoopContext/types";
import { createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy";
import { GetByRefSymbol } from "../StateClass/symbols";
import { IReadonlyStateProxy, IWritableStateProxy } from "../StateClass/types";
import { useWritableStateProxy } from "../StateClass/useWritableStateProxy";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
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
  queue: Array<IUpdateInfo> = [];
  #updating: boolean = false;
  #rendering: boolean = false;
  #engine: IComponentEngine | null = null;

  // Ref情報をキューに追加
  enqueueRef(info: IStructuredPathInfo, listIndex: IListIndex | null, value: any): void {
    this.queue.push({ info, listIndex, value });
    if (this.#rendering) return;
    this.#rendering = true;
    queueMicrotask(() => {
      this.rendering();
    });
  }

  // 状態更新開始
  async beginUpdate(engine: IComponentEngine, loopContext: ILoopContext | null, callback: (state: IWritableStateProxy) => Promise<void>): Promise<void> {
    try {
      this.#updating = true;
      this.#engine = engine;
      await useWritableStateProxy(engine, this, engine.state, loopContext, async (state:IWritableStateProxy) => {
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
        // キュー取得
        const queue = this.queue;
        this.queue = [];
        if (!this.#engine) raiseError("Engine is not initialized.");
        // レンダリング実行
        render(queue, this.#engine);
      }
    } finally {
      this.#rendering = false;
    }
  }
}

export async function update(engine: IComponentEngine, loopContext: ILoopContext | null, callback: (updater: IUpdater, state: IWritableStateProxy) => Promise<void>): Promise<void> {
  const updater = new Updater();
  await updater.beginUpdate(engine, loopContext, async (state) => {
    await callback(updater, state);
  });
}