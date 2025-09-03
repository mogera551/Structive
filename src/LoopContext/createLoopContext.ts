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
import { IListIndex2 } from "../ListIndex2/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo.js";
import { IStructuredPathInfo } from "../StateProperty/types";
import { raiseError } from "../utils.js";
import { ILoopContext } from "./types";

class LoopContext implements ILoopContext {
  #path     : string;
  #info        : IStructuredPathInfo;
  #listIndexRef: WeakRef<IListIndex2> | null;
  #bindContent : IBindContent;
  constructor(
    path    : string | null,
    listIndex  : IListIndex2,
    bindContent: IBindContent
  ) {
    this.#path = path ?? raiseError("name is required");
    this.#info = getStructuredPathInfo(this.#path);
    this.#listIndexRef = new WeakRef(listIndex);
    this.#bindContent = bindContent;
  }
  get path(): string {
    return this.#path;
  }
  get info(): IStructuredPathInfo {
    return this.#info;
  }
  get listIndex(): IListIndex2 {
    return this.#listIndexRef?.deref() ?? raiseError("listIndex is null");
  }
  get listIndexRef(): WeakRef<IListIndex2> {
    return this.#listIndexRef ?? raiseError("listIndexRef is null");
  }
  assignListIndex(listIndex: IListIndex2): void {
    this.#listIndexRef = new WeakRef(listIndex);
    // 構造は変わらないので、#parentLoopContext、#cacheはクリアする必要はない
  }
  clearListIndex():void {
    this.#listIndexRef = null;
  }
  get bindContent(): IBindContent {
    return this.#bindContent;
  }

  #parentLoopContext: ILoopContext | null | undefined;
  get parentLoopContext(): ILoopContext | null {
    if (typeof this.#parentLoopContext === "undefined") {
      let currentBinding: IBindContent | null = this.bindContent;
      while(currentBinding !== null) {
        if (currentBinding.loopContext !== null && currentBinding.loopContext !== this) {
          this.#parentLoopContext = currentBinding.loopContext;
          break;
        }
        currentBinding = currentBinding.parentBinding?.parentBindContent ?? null;
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
  pattern: string | null,
  listIndex: IListIndex2,
  bindContent: IBindContent
): ILoopContext {
  return new LoopContext(pattern, listIndex, bindContent);
}