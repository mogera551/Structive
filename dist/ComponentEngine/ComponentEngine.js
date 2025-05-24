import { createBindContent } from "../DataBinding/BindContent.js";
import { createUpdater } from "../Updater/updater.js";
import { attachShadow } from "./attachShadow.js";
import { buildListIndexTree } from "../StateClass/buildListIndexTree.js";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetByRefSymbol, SetByRefSymbol, SetCacheableSymbol } from "../StateClass/symbols.js";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo.js";
import { BindParentComponentSymbol } from "../ComponentState/symbols.js";
import { raiseError } from "../utils.js";
import { createDependencyEdge } from "../DependencyWalker/createDependencyEdge.js";
import { createReadonlyStateProxy } from "../StateClass/createReadonlyStateProxy.js";
import { useWritableStateProxy } from "../StateClass/useWritableStateProxy.js";
/**
 * ComponentEngineクラスは、Structiveコンポーネントの状態管理・依存関係管理・
 * バインディング・ライフサイクル・レンダリングなどの中核的な処理を担うエンジンです。
 *
 * 主な役割:
 * - 状態インスタンスやプロキシの生成・管理
 * - テンプレート・スタイルシート・フィルター・バインディング情報の管理
 * - 依存関係グラフ（dependentTree）の構築と管理
 * - バインディング情報やリスト情報の保存・取得
 * - ライフサイクル（connectedCallback/disconnectedCallback）処理
 * - Shadow DOMやスタイルシートの適用
 * - 状態プロパティの取得・設定
 * - バインディングの追加・存在判定・リスト管理
 *
 * 構造・設計上の特徴:
 * - 状態や依存関係、バインディング情報を効率的に管理するためのキャッシュやマップを多用
 * - テンプレートやリスト構造の多重管理に対応
 * - 非同期初期化やUpdaterによるバッチ的な状態更新設計
 * - 疎結合な設計で、各種ユーティリティやファクトリ関数と連携
 *
 * 典型的なWeb Componentsのライフサイクルやリアクティブな状態管理を、Structive独自の構造で実現しています。
 */
export class ComponentEngine {
    type = 'autonomous';
    config;
    template;
    styleSheet;
    stateClass;
    state;
    readonlyState;
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
        this.readonlyState = createReadonlyStateProxy(this, this.state);
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
            this.addDependentProp(info, parentInfo, "structured");
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
            const value = this.readonlyState[GetByRefSymbol](info, null);
            buildListIndexTree(this, info, null, value);
        }
    }
    async connectedCallback() {
        if (this.owner.dataset.state) {
            try {
                const json = JSON.parse(this.owner.dataset.state);
                await this.useWritableStateProxy(null, async (stateProxy) => {
                    // JSONから状態を設定する
                    for (const [key, value] of Object.entries(json)) {
                        const info = getStructuredPathInfo(key);
                        if (info.wildcardCount > 0)
                            continue;
                        stateProxy[SetByRefSymbol](info, null, value);
                    }
                });
            }
            catch (e) {
                raiseError("Failed to parse state from dataset");
            }
        }
        this.owner.state[BindParentComponentSymbol]();
        attachShadow(this.owner, this.config, this.styleSheet);
        await this.readonlyState[ConnectedCallbackSymbol]();
        this.readonlyState[SetCacheableSymbol](() => {
            this.bindContent.render();
        });
        this.bindContent.mount(this.owner.shadowRoot ?? this.owner);
        this.#waitForInitialize.resolve();
    }
    async disconnectedCallback() {
        await this.readonlyState[DisconnectedCallbackSymbol]();
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
    existsBindingsByInfo(info) {
        if (typeof this.#saveInfoByStructuredPathId[info.id] !== "undefined") {
            return true;
        }
        if (typeof this.#saveInfoByListIndexByResolvedPathInfoId[info.id] !== "undefined") {
            return true;
        }
        return false;
    }
    getListIndexesSet(info, listIndex) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
        return saveInfo.listIndexesSet;
    }
    getList(info, listIndex) {
        const saveInfo = this.getSaveInfoByStatePropertyRef(info, listIndex);
        return saveInfo.list;
    }
    addDependentProp(info, refInfo, type) {
        let dependents = this.dependentTree.get(refInfo);
        if (typeof dependents === "undefined") {
            dependents = new Set();
            this.dependentTree.set(refInfo, dependents);
        }
        const edge = createDependencyEdge(info, type);
        dependents.add(edge);
    }
    getPropertyValue(info, listIndex) {
        // プロパティの値を取得する
        const readonlyState = createReadonlyStateProxy(this, this.state);
        return readonlyState[GetByRefSymbol](info, listIndex);
    }
    setPropertyValue(info, listIndex, value) {
        // プロパティの値を設定する
        this.updater.addProcess(() => {
            this.useWritableStateProxy(null, async (stateProxy) => {
                stateProxy[SetByRefSymbol](info, listIndex, value);
            });
        });
    }
    // 読み取り専用の状態プロキシを作成する
    createReadonlyStateProxy() {
        return createReadonlyStateProxy(this, this.state);
    }
    // 書き込み可能な状態プロキシを作成する
    async useWritableStateProxy(loopContext, callback) {
        return useWritableStateProxy(this, this.state, loopContext, callback);
    }
}
export function createComponentEngine(config, component) {
    return new ComponentEngine(config, component);
}
