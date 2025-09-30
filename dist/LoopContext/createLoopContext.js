import { getStatePropertyRef } from "../StatePropertyRef/StatepropertyRef";
import { raiseError } from "../utils.js";
class LoopContext {
    #ref;
    #info;
    #bindContent;
    constructor(ref, bindContent) {
        this.#ref = ref;
        this.#info = ref.info;
        this.#bindContent = bindContent;
    }
    get ref() {
        return this.#ref ?? raiseError({
            code: 'STATE-202',
            message: 'ref is null',
            context: { where: 'LoopContext.ref', path: this.#info.pattern },
            docsUrl: '/docs/error-codes.md#state',
        });
    }
    get path() {
        return this.ref.info.pattern;
    }
    get info() {
        return this.ref.info;
    }
    get listIndex() {
        return this.ref.listIndex ?? raiseError({
            code: 'LIST-201',
            message: 'listIndex is required',
            context: { where: 'LoopContext.listIndex', path: this.#info.pattern },
            docsUrl: '/docs/error-codes.md#list',
        });
    }
    assignListIndex(listIndex) {
        this.#ref = getStatePropertyRef(this.#info, listIndex);
        // 構造は変わらないので、#parentLoopContext、#cacheはクリアする必要はない
    }
    clearListIndex() {
        this.#ref = null;
    }
    get bindContent() {
        return this.#bindContent;
    }
    #parentLoopContext;
    get parentLoopContext() {
        if (typeof this.#parentLoopContext === "undefined") {
            let currentBindContent = this.bindContent;
            while (currentBindContent !== null) {
                if (currentBindContent.loopContext !== null && currentBindContent.loopContext !== this) {
                    this.#parentLoopContext = currentBindContent.loopContext;
                    break;
                }
                currentBindContent = currentBindContent.parentBinding?.parentBindContent ?? null;
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
export function createLoopContext(ref, bindContent) {
    return new LoopContext(ref, bindContent);
}
