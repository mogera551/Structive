import { createBindContent } from "../DataBinding/BindContent.js";
import { createStateProxy } from "../StateClass/createStateProxy.js";
import { createUpdater } from "../Updater/updater.js";
import { attachShadow } from "./attachShadow.js";
import { buildListIndexTree } from "../StateClass/buildListIndexTree.js";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetByRefSymbol, SetByRefSymbol, SetCacheableSymbol } from "../StateClass/symbols.js";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo.js";
import { BindParentComponentSymbol } from "../ComponentState/symbols.js";
export class ComponentEngine {
    type = 'autonomous';
    config;
    template;
    styleSheet;
    stateClass;
    state;
    stateProxy;
    updater;
    inputFilters;
    outputFilters;
    bindContent;
    baseClass = HTMLElement;
    owner;
    trackedGetters;
    listInfoSet = new Set();
    elementInfoSet = new Set();
    bindingsByListIndex = new WeakMap();
    dependentTree = new Map();
    bindingsByComponent = new WeakMap();
    #waitForInitialize = Promise.withResolvers();
    #loopContext = null;
    #stackStructuredPathInfo = [];
    #stackListIndex = [];
    constructor(config, owner) {
        this.config = config;
        if (this.config.extends) {
            this.type = 'builtin';
        }
        const componentClass = owner.constructor;
        this.template = componentClass.template;
        this.styleSheet = componentClass.styleSheet;
        this.stateClass = componentClass.stateClass;
        this.state = new this.stateClass();
        this.stateProxy = createStateProxy(this, this.state);
        this.updater = createUpdater(this);
        this.inputFilters = componentClass.inputFilters;
        this.outputFilters = componentClass.outputFilters;
        this.owner = owner;
        this.trackedGetters = componentClass.trackedGetters;
        // 依存関係の木を作成する
        const checkDependentProp = (info) => {
            const parentInfo = info.parentInfo;
            if (parentInfo === null)
                return;
            this.addDependentProp(info, parentInfo);
            checkDependentProp(parentInfo);
        };
        for (const path of componentClass.paths) {
            const info = getStructuredPathInfo(path);
            checkDependentProp(info);
        }
        // 配列のプロパティ、配列要素のプロパティを登録する
        for (const listPath of componentClass.listPaths) {
            this.listInfoSet.add(getStructuredPathInfo(listPath));
            this.elementInfoSet.add(getStructuredPathInfo(listPath + ".*"));
        }
        this.bindContent = createBindContent(null, componentClass.id, this, null, null); // this.stateArrayPropertyNamePatternsが変更になる可能性がある
        for (const info of this.listInfoSet) {
            if (info.wildcardCount > 0)
                continue;
            const value = this.stateProxy[GetByRefSymbol](info, null);
            buildListIndexTree(this, info, null, value);
        }
        this.updater.main(this.#waitForInitialize);
    }
    async connectedCallback() {
        this.owner.state[BindParentComponentSymbol]();
        attachShadow(this.owner, this.config, this.styleSheet);
        await this.stateProxy[ConnectedCallbackSymbol]();
        await this.stateProxy[SetCacheableSymbol](async () => {
            this.bindContent.render();
        });
        this.bindContent.mount(this.owner.shadowRoot ?? this.owner);
        this.#waitForInitialize.resolve();
    }
    async disconnectedCallback() {
        await this.stateProxy[DisconnectedCallbackSymbol]();
    }
    async setLoopContext(loopContext, callback) {
        try {
            if (this.#loopContext !== null) {
                throw new Error("loopContext is already set");
            }
            this.#loopContext = loopContext;
            await this.asyncSetStatePropertyRef(loopContext.info, loopContext.listIndex, async () => {
                await callback();
            });
        }
        finally {
            this.#loopContext = null;
        }
    }
    async asyncSetStatePropertyRef(info, listIndex, callback) {
        this.#stackStructuredPathInfo.push(info);
        this.#stackListIndex.push(listIndex);
        try {
            return await callback();
        }
        finally {
            this.#stackStructuredPathInfo.pop();
            this.#stackListIndex.pop();
        }
    }
    setStatePropertyRef(info, listIndex, callback) {
        this.#stackStructuredPathInfo.push(info);
        this.#stackListIndex.push(listIndex);
        try {
            return callback();
        }
        finally {
            this.#stackStructuredPathInfo.pop();
            this.#stackListIndex.pop();
        }
    }
    getLastStatePropertyRef() {
        if (this.#stackStructuredPathInfo.length === 0) {
            return null;
        }
        const info = this.#stackStructuredPathInfo[this.#stackStructuredPathInfo.length - 1];
        if (typeof info === "undefined") {
            return null;
        }
        const listIndex = this.#stackListIndex[this.#stackListIndex.length - 1];
        if (typeof listIndex === "undefined") {
            return null;
        }
        return { info, listIndex };
    }
    getContextListIndex(structuredPath) {
        const lastRef = this.getLastStatePropertyRef();
        if (lastRef === null) {
            return null;
        }
        const info = lastRef.info;
        const index = info.wildcardPaths.indexOf(structuredPath);
        if (index >= 0) {
            return lastRef.listIndex.at(index) ?? null;
        }
        return null;
    }
    getLoopContexts() {
        if (this.#loopContext === null) {
            throw new Error("loopContext is null");
        }
        return this.#loopContext.serialize();
    }
    #saveInfoByListIndexByResolvedPathInfoId = {};
    #saveInfoByStructuredPathId = {};
    createSaveInfo() {
        return {
            list: null,
            listIndexesSet: null,
            bindings: [],
        };
    }
    getSaveInfoByStatePropertyRef(info, listIndex) {
        if (listIndex === null) {
            let saveInfo = this.#saveInfoByStructuredPathId[info.id];
            if (typeof saveInfo === "undefined") {
                saveInfo = this.createSaveInfo();
                this.#saveInfoByStructuredPathId[info.id] = saveInfo;
            }
            return saveInfo;
        }
        else {
            let saveInfoByListIndex = this.#saveInfoByListIndexByResolvedPathInfoId[info.id];
            if (typeof saveInfoByListIndex === "undefined") {
                saveInfoByListIndex = new WeakMap();
                this.#saveInfoByListIndexByResolvedPathInfoId[info.id] = saveInfoByListIndex;
            }
            let saveInfo = saveInfoByListIndex.get(listIndex);
            if (typeof saveInfo === "undefined") {
                saveInfo = this.createSaveInfo();
                saveInfoByListIndex.set(listIndex, saveInfo);
            }
            return saveInfo;
        }
    }
    saveBinding(info, listIndex, binding) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
        saveInfo.bindings.push(binding);
    }
    saveListIndexesSet(info, listIndex, saveListIndexesSet) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
        saveInfo.listIndexesSet = saveListIndexesSet;
    }
    saveList(info, listIndex, list) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
        saveInfo.list = list;
    }
    getBindings(info, listIndex) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
        return saveInfo.bindings;
    }
    getListIndexesSet(info, listIndex) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
        return saveInfo.listIndexesSet;
    }
    getList(info, listIndex) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
        return saveInfo.list;
    }
    addDependentProp(info, refInfo) {
        let dependents = this.dependentTree.get(refInfo);
        if (typeof dependents === "undefined") {
            dependents = new Set();
            this.dependentTree.set(refInfo, dependents);
        }
        dependents.add(info);
    }
    getPropertyValue(info, listIndex) {
        // プロパティの値を取得する
        return this.stateProxy[GetByRefSymbol](info, listIndex);
    }
    setPropertyValue(info, listIndex, value) {
        // プロパティの値を設定する
        this.updater.addProcess(() => {
            this.stateProxy[SetByRefSymbol](info, listIndex, value);
        });
    }
}
export function createComponentEngine(config, component) {
    return new ComponentEngine(config, component);
}
