import { IBindContent } from "../DataBinding/types";
import { IListIndex } from "../ListIndex/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo.js";
import { IStructuredPathInfo } from "../StateProperty/types";
import { raiseError } from "../utils.js";
import { ILoopContext } from "./types";

class LoopContext implements ILoopContext {
  #path     : string;
  #info        : IStructuredPathInfo;
  #listIndexRef: WeakRef<IListIndex> | null;
  #bindContent : IBindContent;
  constructor(
    path    : string | null,
    listIndex  : IListIndex,
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
  get listIndex(): IListIndex {
    return this.#listIndexRef?.deref() ?? raiseError("listIndex is null");
  }
  get listIndexRef(): WeakRef<IListIndex> {
    return this.#listIndexRef ?? raiseError("listIndexRef is null");
  }
  assignListIndex(listIndex: IListIndex): void {
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
  listIndex: IListIndex,
  bindContent: IBindContent
): ILoopContext {
  return new LoopContext(pattern, listIndex, bindContent);
}