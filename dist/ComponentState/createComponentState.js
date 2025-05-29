import { GetByRefSymbol, SetByRefSymbol } from "../StateClass/symbols";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo.js";
import { BindParentComponentSymbol, GetPropertyValueFromChildSymbol, NamesSymbol, RenderSymbol, SetPropertyValueFromChildSymbol } from "./symbols.js";
/**
 * createComponentState.ts
 *
 * Structiveコンポーネントの状態管理を担う「ComponentState」クラスと、そのプロキシ生成関数の実装。
 *
 * 主な役割:
 * - 親コンポーネントとのバインディング（親プロパティのgetter/setterを動的に定義）
 * - 親コンポーネントからのバインディング一括登録（bindParentComponent）
 * - 状態プロパティの取得・設定・レンダリング（getPropertyValue, setPropertyValue, render）
 * - Proxyハンドラで、プロパティアクセスを自動的にget/set/特殊メソッドに振り分け
 *
 * 構造・設計ポイント:
 * - 親子コンポーネント間のデータ連携を柔軟に実現
 * - ループコンテキストや非同期更新にも対応
 * - Proxyによる柔軟なAPI（state.xxxで直接アクセス可能）
 *
 * @param engine IComponentEngineインスタンス
 * @returns      IComponentStateProxy（Proxyラップされた状態オブジェクト）
 */
class ComponentState {
    engine;
    bindingByName = {};
    #names;
    constructor(engine) {
        this.engine = engine;
    }
    get names() {
        return this.#names ?? new Set();
    }
    bindParentProperty(binding) {
        const propName = binding.bindingNode.subName;
        this.bindingByName[propName] = binding;
        Object.defineProperty(this.engine.state, propName, {
            get: () => {
                return binding.bindingState.filteredValue;
            },
            set: (value) => {
                const engine = binding.engine;
                const loopContext = binding.parentBindContent.currentLoopContext;
                engine.updater.addProcess(async () => {
                    engine.useWritableStateProxy(loopContext, async (stateProxy) => {
                        // Set the value in the writable state proxy
                        // This will trigger the binding update logic
                        return binding.updateStateValue(stateProxy, value);
                    });
                });
            }
        });
    }
    unbindParentProperty(binding) {
        const propName = binding.bindingNode.subName;
        Object.defineProperty(this.engine.state, propName, { value: undefined });
    }
    /**
     * 子コンポーネントから呼び出される
     */
    bindParentComponent() {
        // bindParentComponent
        const parent = this.engine.owner.parentStructiveComponent;
        if (parent === null) {
            return;
        }
        const bindings = parent.getBindingsFromChild(this.engine.owner);
        for (const binding of bindings ?? []) {
            this.bindParentProperty(binding);
        }
        this.#names = new Set(Object.keys(this.bindingByName));
    }
    unbindParentComponent() {
        // unbindParentComponent
        for (const name of this.names) {
            const binding = this.bindingByName[name];
            if (binding) {
                this.unbindParentProperty(binding);
            }
        }
    }
    render(name, value) {
        if (!this.names.has(name)) {
            return;
        }
        // render
        const info = getStructuredPathInfo(name);
        this.engine.updater.addUpdatedStatePropertyRefValue(info, null, value);
    }
    getPropertyValue(name) {
        // getPropertyValue
        const info = getStructuredPathInfo(name);
        return this.engine.getPropertyValue(info, null);
    }
    setPropertyValue(name, value) {
        // setPropertyValue
        const info = getStructuredPathInfo(name);
        this.engine.setPropertyValue(info, null, value);
    }
    getPropertyValueFromChild(name) {
        const info = getStructuredPathInfo(name);
        const rootName = info.cumulativePaths[0];
        if (!this.names.has(rootName)) {
            return undefined;
        }
        const parentBinding = this.bindingByName[rootName];
        const remainName = name.slice(rootName.length); // include dot
        const parentPropName = parentBinding?.bindingState.pattern + remainName;
        const parentPropInfo = getStructuredPathInfo(parentPropName);
        const listIndex = parentBinding.bindingState.listIndex ?? null;
        return parentBinding.bindingState.state[GetByRefSymbol](parentPropInfo, listIndex);
    }
    setPropertyValueFromChild(name, value) {
        const info = getStructuredPathInfo(name);
        const rootName = info.cumulativePaths[0];
        if (!this.names.has(rootName)) {
            return;
        }
        const parentBinding = this.bindingByName[rootName];
        const loopContext = parentBinding.parentBindContent.currentLoopContext;
        const remainName = name.slice(rootName.length); // include dot
        const parentPropName = parentBinding?.bindingState.pattern + remainName;
        const parentPropInfo = getStructuredPathInfo(parentPropName);
        const listIndex = parentBinding.bindingState.listIndex ?? null;
        const engine = parentBinding.engine;
        engine.updater.addProcess(async () => {
            engine.useWritableStateProxy(loopContext, async (stateProxy) => {
                // Set the value in the writable state proxy
                // This will trigger the binding update logic
                return stateProxy[SetByRefSymbol](parentPropInfo, listIndex, value);
            });
        });
    }
}
class ComponentStateHandler {
    get(state, prop, receiver) {
        if (prop === RenderSymbol) {
            return state.render.bind(state);
        }
        else if (prop === BindParentComponentSymbol) {
            // 子コンポーネントから呼ばれる
            return state.bindParentComponent.bind(state);
        }
        else if (prop === NamesSymbol) {
            return state.names;
        }
        else if (prop === GetPropertyValueFromChildSymbol) {
            return state.getPropertyValueFromChild.bind(state);
        }
        else if (prop === SetPropertyValueFromChildSymbol) {
            return state.setPropertyValueFromChild.bind(state);
        }
        else if (typeof prop === 'string') {
            return state.getPropertyValue(prop);
        }
        else {
            return Reflect.get(state, prop, receiver);
        }
    }
    set(state, prop, value, receiver) {
        if (typeof prop === 'string') {
            state.setPropertyValue(prop, value);
            return true;
        }
        else {
            return Reflect.set(state, prop, value, receiver);
        }
    }
}
;
export const createComponentState = (engine) => {
    return new Proxy(new ComponentState(engine), new ComponentStateHandler());
};
