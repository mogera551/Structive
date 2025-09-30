/**
 * createLoopContext.ts
 *
 * ループバインディング（for等）で利用するLoopContext（ループコンテキスト）管理クラスとファクトリ関数の実装です。
 *
 * 主な役割:
 * - ループごとのプロパティパス・インデックス・BindContentを紐付けて管理
 * - 親ループコンテキストの探索やキャッシュ、インデックスの再割り当て・クリアなどを提供
 * - ループ階層をたどるwalk/serializeや、名前でのfind検索も可能
 *
 * 設計ポイント:
 * - WeakRefでlistIndexを保持し、GCフレンドリーな設計
 * - parentLoopContextで親ループを遅延探索・キャッシュし、効率的な親子関係管理を実現
 * - findで名前からループコンテキストを高速検索（キャッシュ付き）
 * - walk/serializeでループ階層をたどる処理を簡潔に記述可能
 * - createLoopContextファクトリで一貫した生成・管理が可能
 */
import { IBindContent } from "../DataBinding/types";
import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { raiseError } from "../utils.js";
import { ILoopContext } from "./types";

class LoopContext implements ILoopContext {
  #ref: IStatePropertyRef | null;
  #info: IStructuredPathInfo;
  #bindContent : IBindContent;
  constructor(
    ref: IStatePropertyRef,
    bindContent: IBindContent
  ) {
    this.#ref = ref;
    this.#info = ref.info;
    this.#bindContent = bindContent;
  }
  get ref(): IStatePropertyRef {
    return this.#ref ?? raiseError({
      code: 'STATE-202',
      message: 'ref is null',
      context: { where: 'LoopContext.ref', path: this.#info.pattern },
      docsUrl: '/docs/error-codes.md#state',
    });
  }
  get path(): string {
    return this.ref.info.pattern;
  }
  get info(): IStructuredPathInfo {
    return this.ref.info;
  }
  get listIndex(): IListIndex {
    return this.ref.listIndex ?? raiseError({
      code: 'LIST-201',
      message: 'listIndex is required',
      context: { where: 'LoopContext.listIndex', path: this.#info.pattern },
      docsUrl: '/docs/error-codes.md#list',
    });
  }
  assignListIndex(listIndex: IListIndex): void {
    this.#ref = getStatePropertyRef(this.#info, listIndex);
    // 構造は変わらないので、#parentLoopContext、#cacheはクリアする必要はない
  }
  clearListIndex():void {
    this.#ref = null;
  }
  get bindContent(): IBindContent {
    return this.#bindContent;
  }

  #parentLoopContext: ILoopContext | null | undefined;
  get parentLoopContext(): ILoopContext | null {
    if (typeof this.#parentLoopContext === "undefined") {
      let currentBindContent: IBindContent | null = this.bindContent;
      while(currentBindContent !== null) {
        if (currentBindContent.loopContext !== null && currentBindContent.loopContext !== this) {
          this.#parentLoopContext = currentBindContent.loopContext;
          break;
        }
        currentBindContent = currentBindContent.parentBinding?.parentBindContent ?? null;
      }
      if (typeof this.#parentLoopContext === "undefined") this.#parentLoopContext = null;
    }
    return this.#parentLoopContext;
  }

  #cache:Record<string, ILoopContext | null> = {};
  find(name: string): ILoopContext | null {
    let loopContext = this.#cache[name];
    if (typeof loopContext === "undefined") {
      let currentLoopContext: ILoopContext | null = this;
      while(currentLoopContext !== null) {
        if (currentLoopContext.path === name) break;
        currentLoopContext = currentLoopContext.parentLoopContext;
      }
      loopContext = this.#cache[name] = currentLoopContext;
    }
    return loopContext;
  }

  walk(callback: (loopContext: ILoopContext) => void): void {
    let currentLoopContext: ILoopContext | null = this;
    while(currentLoopContext !== null) {
      callback(currentLoopContext);
      currentLoopContext = currentLoopContext.parentLoopContext;
    }
  }

  serialize(): ILoopContext[] {
    const results: ILoopContext[] = [];
    this.walk((loopContext) => {
      results.unshift(loopContext);
    });
    return results;
  }

}

// 生成されたあと、IBindContentのloopContextに登録される
// IBindContentにずっと保持される
export function createLoopContext(
  ref: IStatePropertyRef,
  bindContent: IBindContent
): ILoopContext {
  return new LoopContext(ref, bindContent);
}