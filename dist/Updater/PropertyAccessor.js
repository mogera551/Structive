import { raiseError } from "../utils";
import { calcListDiff } from "../ListDiff/ListDiff";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetAccessorSymbol, GetByRefSymbol, SetByRefSymbol } from "../StateClass/symbols";
class UpdateContext {
    #version;
    #engine;
    #updater;
    #listDiffByRef = new Map();
    #stackRefsForCalcListDiff = new Set();
    constructor(engine, updater, version) {
        this.#engine = engine;
        this.#updater = updater;
        this.#version = version;
    }
    getCacheEntry(ref) {
        return this.#engine.getCacheEntry(ref) ?? raiseError({
            code: 'CACHE-201',
            message: 'cacheEntry is null',
            context: { where: 'PropertyAccessor.getCacheEntry', refPath: ref.info.pattern },
            docsUrl: '/docs/error-codes.md#cache',
        });
    }
    updateOnDirty(state, cacheEntry, ref) {
        // キャッシュが古い場合は、最新の値を取得してキャッシュを更新
        const value = state[GetByRefSymbol](ref);
        cacheEntry.setValue(value, this.#version);
        if (this.#engine.pathManager.lists.has(ref.info.pattern)) {
            this.calcListDiff(state, ref);
        }
        return value;
    }
    getValue(state, ref) {
        const cacheEntry = this.getCacheEntry(ref);
        if (cacheEntry.isDirty(state[GetAccessorSymbol])) {
            this.updateOnDirty(state, cacheEntry, ref);
        }
        return cacheEntry.value;
    }
    forceUpdateCache(state, ref) {
        // 強制的にキャッシュを更新
        const cacheEntry = this.getCacheEntry(ref);
        this.updateOnDirty(state, cacheEntry, ref);
    }
    setValue(state, ref, value) {
        try {
            state[SetByRefSymbol](ref, value);
            const cacheEntry = this.getCacheEntry(ref);
            cacheEntry.setValue(value, this.#version);
        }
        finally {
            this.#updater.enqueueRef(ref);
        }
    }
    getListIndexes(state, ref) {
        const cacheEntry = this.getCacheEntry(ref);
        if (cacheEntry.isDirty(state[GetAccessorSymbol])) {
            this.updateOnDirty(state, cacheEntry, ref);
        }
        return this.#engine.getListIndexes(ref);
    }
    getListAndIndexes(state, ref) {
        const cacheEntry = this.getCacheEntry(ref);
        if (cacheEntry.isDirty(state[GetAccessorSymbol])) {
            this.updateOnDirty(state, cacheEntry, ref);
        }
        return this.#engine.getListAndListIndexes(ref);
    }
    getBindings(state, ref) {
        const cacheEntry = this.getCacheEntry(ref);
        if (cacheEntry.isDirty(state[GetAccessorSymbol])) {
            this.updateOnDirty(state, cacheEntry, ref);
        }
        return this.#engine.getBindings(ref);
    }
    calcListDiff(state, ref) {
        if (this.#stackRefsForCalcListDiff.has(ref)) {
            console.warn('Circular reference detected in calcListDiff:', Array.from(this.#stackRefsForCalcListDiff).map(r => r.key));
            return null;
        }
        this.#stackRefsForCalcListDiff.add(ref);
        try {
            let listDiff = this.#listDiffByRef.get(ref);
            const newListValue = this.getValue(state, ref);
            if (typeof listDiff === "undefined") {
                const [oldListValue, oldListIndexes] = this.#engine.getListAndListIndexes(ref);
                listDiff = calcListDiff(ref.listIndex, oldListValue, newListValue, oldListIndexes);
                this.#listDiffByRef.set(ref, listDiff);
                if (oldListValue !== newListValue) {
                    this.#engine.saveListAndListIndexes(ref, newListValue, listDiff.newIndexes);
                }
            }
            else {
                if (listDiff.newListValue !== newListValue) {
                    listDiff = calcListDiff(ref.listIndex, listDiff.oldListValue, newListValue, listDiff.oldIndexes);
                    this.#listDiffByRef.set(ref, listDiff);
                    this.#engine.saveListAndListIndexes(ref, newListValue, listDiff.newIndexes);
                }
            }
            return listDiff;
        }
        finally {
            this.#stackRefsForCalcListDiff.delete(ref);
        }
    }
    getListDiff(ref) {
        return this.#listDiffByRef.get(ref) ?? null;
    }
}
export function createUpdateContext(engine, updater, version) {
    return new UpdateContext(engine, updater, version);
}
class PropertyAccessor {
    #state;
    #context;
    constructor(state, context) {
        this.#state = state;
        this.#context = context;
    }
    getValue(ref) {
        return this.#context.getValue(this.#state, ref);
    }
    forceUpdateCache(ref) {
        this.#context.forceUpdateCache(this.#state, ref);
    }
    setValue(ref, value) {
        if (!(SetByRefSymbol in this.#state)) {
            raiseError({
                code: "PROP-001",
                message: "State is not writable",
                docsUrl: "./docs/error-codes.md#prop",
            });
        }
        this.#context.setValue(this.#state, ref, value);
    }
    getListIndexes(ref) {
        return this.#context.getListIndexes(this.#state, ref);
    }
    getListAndIndexes(ref) {
        return this.#context.getListAndIndexes(this.#state, ref);
    }
    getBindings(ref) {
        return this.#context.getBindings(this.#state, ref);
    }
    calcListDiff(ref) {
        return this.#context.calcListDiff(this.#state, ref);
    }
    getListDiff(ref) {
        return this.#context.getListDiff(ref);
    }
    async connectedCallback() {
        if (!(ConnectedCallbackSymbol in this.#state)) {
            raiseError({
                code: "PROP-002",
                message: "State does not support connectedCallback",
                docsUrl: "./docs/error-codes.md#prop",
            });
        }
        return await this.#state[ConnectedCallbackSymbol]();
    }
    async disconnectedCallback() {
        if (!(DisconnectedCallbackSymbol in this.#state)) {
            raiseError({
                code: "PROP-003",
                message: "State does not support disconnectedCallback",
                docsUrl: "./docs/error-codes.md#prop",
            });
        }
        return await this.#state[DisconnectedCallbackSymbol]();
    }
    get state() {
        return this.#state;
    }
}
export function createPropertyAccessor(state, context) {
    return new PropertyAccessor(state, context);
}
