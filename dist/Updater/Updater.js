import { createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy";
import { GetAccessorSymbol } from "../StateClass/symbols";
import { useWritableStateProxy } from "../StateClass/useWritableStateProxy";
import { raiseError } from "../utils";
import { createUpdateContext } from "./PropertyAccessor";
import { render } from "./Renderer";
/**
 * Updater2クラスは、状態管理と更新の中心的な役割を果たします。
 * 状態更新が必要な場合に、都度インスタンスを作成して使用します。
 * 主な機能は以下の通りです:
 */
class Updater {
    queue = [];
    #updating = false;
    #rendering = false;
    #engine;
    #version;
    #context;
    /**
     * リスト参照の差分計算キャッシュ。
     */
    #listDiffByRef = new Map();
    constructor(engine, version) {
        this.#engine = engine;
        this.#version = version;
        this.#context = createUpdateContext(engine, this, this.#version);
    }
    get version() {
        return this.#version;
    }
    get context() {
        return this.#context;
    }
    get listDiffByRef() {
        return this.#listDiffByRef;
    }
    // Ref情報をキューに追加
    enqueueRef(ref) {
        this.queue.push(ref);
        if (this.#rendering)
            return;
        this.#rendering = true;
        queueMicrotask(() => {
            this.rendering();
        });
    }
    // 状態更新開始
    async beginUpdate(loopContext, callback) {
        try {
            this.#updating = true;
            await useWritableStateProxy(this.#engine, this.#context, this.#engine.state, loopContext, async (state) => {
                // 状態更新処理
                await callback(state);
            });
        }
        finally {
            this.#updating = false;
        }
    }
    // レンダリング
    rendering() {
        try {
            while (this.queue.length > 0) {
                // キュー取得
                const queue = this.queue;
                this.queue = [];
                if (!this.#engine)
                    raiseError({
                        code: "UPD-001",
                        message: "Engine not initialized",
                        docsUrl: "./docs/error-codes.md#upd",
                    });
                // レンダリング実行
                render(queue, this.#engine, this, this.#version);
            }
        }
        finally {
            this.#rendering = false;
        }
    }
    createReadonlyStateProxy() {
        return createReadonlyStateProxy(this.#engine, this.#context, this.#engine.state);
    }
    createPropertyAccessor() {
        const proxy = this.createReadonlyStateProxy();
        return proxy[GetAccessorSymbol];
    }
}
export function createUpdater(engine) {
    return new Updater(engine, engine.getUpdaterVersion());
}
export async function update(engine, loopContext, callback) {
    const updater = createUpdater(engine);
    await updater.beginUpdate(loopContext, async (state) => {
        await callback(updater, state[GetAccessorSymbol]);
    });
}
