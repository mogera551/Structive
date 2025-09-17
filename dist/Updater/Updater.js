import { useWritableStateProxy } from "../StateClass/useWritableStateProxy";
import { raiseError } from "../utils";
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
    #engine = null;
    // Ref情報をキューに追加
    enqueueRef(info, listIndex, value) {
        this.queue.push({ info, listIndex, value });
        if (this.#rendering)
            return;
        this.#rendering = true;
        queueMicrotask(() => {
            this.rendering();
        });
    }
    // 状態更新開始
    async beginUpdate(engine, loopContext, callback) {
        try {
            this.#updating = true;
            this.#engine = engine;
            await useWritableStateProxy(engine, this, engine.state, loopContext, async (state) => {
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
                    raiseError("Engine is not initialized.");
                // レンダリング実行
                render(queue, this.#engine);
            }
        }
        finally {
            this.#rendering = false;
        }
    }
}
export async function update2(engine, loopContext, callback) {
    const updater = new Updater();
    await updater.beginUpdate(engine, loopContext, async (state) => {
        await callback(updater, state);
    });
}
