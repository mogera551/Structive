import { IComponentEngine } from "../ComponentEngine/types";
import { IListDiff } from "../ListDiff/types";
import { ILoopContext } from "../LoopContext/types";
import { createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy";
import { GetAccessorSymbol } from "../StateClass/symbols";
import { IReadonlyStateProxy, IWritableStateProxy } from "../StateClass/types";
import { useWritableStateProxy } from "../StateClass/useWritableStateProxy";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { raiseError } from "../utils";
import { createPropertyAccessor, createUpdateContext } from "./PropertyAccessor";
import { render } from "./Renderer";
import { IPropertyAccessor, IUpdateContext, IUpdater } from "./types";


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
  #version: number;
  #context: IUpdateContext;
  /**
   * リスト参照の差分計算キャッシュ。
   */
  #listDiffByRef: Map<IStatePropertyRef, IListDiff> = new Map();

  constructor(engine: IComponentEngine, version: number) {
    this.#engine = engine;
    this.#version = version;
    this.#context = createUpdateContext(engine, this, this.#version);
  }

  get version(): number {
    return this.#version;
  }

  get context(): IUpdateContext {
    return this.#context;
  }

  get listDiffByRef(): Map<IStatePropertyRef, IListDiff> {
    return this.#listDiffByRef;
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
  async beginUpdate(loopContext: ILoopContext | null, callback: (state: IWritableStateProxy) => Promise<void>): Promise<void> {
    try {
      this.#updating = true;
      await useWritableStateProxy(this.#engine, this.#context, this.#engine.state, loopContext, async (state:IWritableStateProxy) => {
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
        if (!this.#engine) raiseError({
          code: "UPD-001",
          message: "Engine not initialized",
          docsUrl: "./docs/error-codes.md#upd",
        });
        // レンダリング実行
        render(queue, this.#engine, this, this.#version);
      }
    } finally {
      this.#rendering = false;
    }
  }

  createReadonlyStateProxy(): IReadonlyStateProxy {
    return createReadonlyStateProxy(this.#engine, this.#context, this.#engine.state);
  }

  createPropertyAccessor(): IPropertyAccessor {
    const proxy = this.createReadonlyStateProxy();
    return proxy[GetAccessorSymbol];
  }
}

export function createUpdater(engine:IComponentEngine): IUpdater {
  return new Updater(engine, engine.getUpdaterVersion());
}

export async function update(engine: IComponentEngine, loopContext: ILoopContext | null, callback: (updater: IUpdater, accessor: IPropertyAccessor) => Promise<void>): Promise<void> {
  const updater = createUpdater(engine);
  await updater.beginUpdate(loopContext, async (state) => {
    await callback(updater, state[GetAccessorSymbol]);
  });
}

