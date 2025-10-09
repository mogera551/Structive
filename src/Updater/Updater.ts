import { IComponentEngine } from "../ComponentEngine/types";
import { ILoopContext } from "../LoopContext/types";
import { IWritableStateHandler, IWritableStateProxy } from "../StateClass/types";
import { useWritableStateProxy } from "../StateClass/useWritableStateProxy";
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
  #engine: IComponentEngine | null = null;

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
  async beginUpdate(engine: IComponentEngine, loopContext: ILoopContext | null, callback: (state: IWritableStateProxy, handler: IWritableStateHandler) => Promise<void>): Promise<void> {
    try {
      this.#updating = true;
      this.#engine = engine;
      await useWritableStateProxy(engine, this, engine.state, loopContext, async (state:IWritableStateProxy, handler:IWritableStateHandler) => {
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
}

export async function update(engine: IComponentEngine, loopContext: ILoopContext | null, callback: (updater: IUpdater, state: IWritableStateProxy, handler: IWritableStateHandler) => Promise<void>): Promise<void> {
  const updater = new Updater();
  await updater.beginUpdate(engine, loopContext, async (state, handler) => {
    await callback(updater, state, handler);
  });
}