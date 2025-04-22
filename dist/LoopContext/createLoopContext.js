import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { raiseError } from "../utils";
class LoopContext {
    #path;
    #info;
    #listIndexRef;
    #bindContent;
    constructor(path, listIndex, bindContent) {
        this.#path = path ?? raiseError("name is required");
        this.#info = getStructuredPathInfo(this.#path);
        this.#listIndexRef = new WeakRef(listIndex);
        this.#bindContent = bindContent;
    }
    get path() {
        return this.#path;
    }
    get info() {
        return this.#info;
    }
    get listIndex() {
        return this.#listIndexRef?.deref() ?? raiseError("listIndex is null");
    }
    get listIndexRef() {
        return this.#listIndexRef ?? raiseError("listIndexRef is null");
    }
    assignListIndex(listIndex) {
        this.#listIndexRef = new WeakRef(listIndex);
        // 構造は変わらないので、#parentLoopContext、#cacheはクリアする必要はない
    }
    clearListIndex() {
        this.#listIndexRef = null;
    }
    get bindContent() {
        return this.#bindContent;
    }
    #parentLoopContext;
    get parentLoopContext() {
        if (typeof this.#parentLoopContext === "undefined") {
            let currentBinding = this.bindContent;
            while (currentBinding !== null) {
                if (currentBinding.loopContext !== null && currentBinding.loopContext !== this) {
                    this.#parentLoopContext = currentBinding.loopContext;
                    break;
                }
                currentBinding = currentBinding.parentBinding?.parentBindContent ?? null;
            }
            if (typeof this.#parentLoopContext === "undefined")
                this.#parentLoopContext = null;
        }
        return this.#parentLoopContext;
    }
    #cache = {};
    find(name) {
        let loopContext = this.#cache[name];
        if (typeof loopContext === "undefined") {
            let currentLoopContext = this;
            while (currentLoopContext !== null) {
                if (currentLoopContext.path === name)
                    break;
                currentLoopContext = currentLoopContext.parentLoopContext;
            }
            loopContext = this.#cache[name] = currentLoopContext;
        }
        return loopContext;
    }
    walk(callback) {
        let currentLoopContext = this;
        while (currentLoopContext !== null) {
            callback(currentLoopContext);
            currentLoopContext = currentLoopContext.parentLoopContext;
        }
    }
    serialize() {
        const results = [];
        this.walk((loopContext) => {
            results.unshift(loopContext);
        });
        return results;
    }
}
// 生成されたあと、IBindContentのloopContextに登録される
// IBindContentにずっと保持される
export function createLoopContext(pattern, listIndex, bindContent) {
    return new LoopContext(pattern, listIndex, bindContent);
}
