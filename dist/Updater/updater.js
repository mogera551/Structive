import { render } from "./render.js";
import { SetCacheableSymbol } from "../StateClass/symbols.js";
import { raiseError } from "../utils.js";
import { restructListIndexes } from "./restructListIndex";
import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
class Updater {
    updatedProperties = new Set;
    updatedValues = {};
    engine;
    #version = 0;
    constructor(engine) {
        this.engine = engine;
    }
    get version() {
        return this.#version;
    }
    addProcess(process) {
        queueMicrotask(process);
    }
    addUpdatedStatePropertyRefValue(info, listIndex, value) {
        const refKey = createRefKey(info, listIndex);
        this.updatedProperties.add({ info, listIndex });
        this.updatedValues[refKey] = value;
        this.entryRender();
    }
    addUpdatedListIndex(listIndex) {
        this.updatedProperties.add(listIndex);
        this.entryRender();
    }
    #isEntryRender = false;
    entryRender() {
        if (this.#isEntryRender)
            return;
        this.#isEntryRender = true;
        const engine = this.engine;
        queueMicrotask(() => {
            try {
                const { bindings, arrayElementBindings, properties } = this.rebuild();
                // スワップ処理
                for (const arrayElementBinding of arrayElementBindings) {
                    arrayElementBinding.binding.bindingNode.updateElements(arrayElementBinding.listIndexes, arrayElementBinding.values);
                }
                // レンダリング
                if (bindings.length > 0) {
                    this.render(bindings);
                }
                // 子コンポーネントへの再描画通知
                if (engine.structiveComponents.size > 0) {
                    for (const structiveComponent of engine.structiveComponents) {
                        const structiveComponentBindings = engine.bindingsByComponent.get(structiveComponent) ?? new Set();
                        for (const binding of structiveComponentBindings) {
                            binding.notifyRedraw(properties);
                        }
                    }
                }
            }
            finally {
                this.#isEntryRender = false;
            }
        });
    }
    rebuild() {
        const retArrayElementBindings = [];
        const retBindings = [];
        const retProperties = [];
        const engine = this.engine;
        while (this.updatedProperties.size > 0) {
            const updatedProiperties = Array.from(this.updatedProperties.values());
            this.updatedProperties.clear();
            const bindingsByListIndex = [];
            const updatedRefs = []; // 更新されたプロパティ参照のリスト
            const arrayElementBindingByParentRefKey = new Map();
            for (let i = 0; i < updatedProiperties.length; i++) {
                const item = updatedProiperties[i];
                if ("index" in item) {
                    const bindings = engine.bindingsByListIndex.get(item) ?? [];
                    bindingsByListIndex.push(...bindings);
                }
                else {
                    updatedRefs.push(item);
                    if (engine.elementInfoSet.has(item.info)) {
                        const parentInfo = item.info.parentInfo ?? raiseError("info is null"); // リストのパス情報
                        const parentListIndex = item.listIndex?.at(-2) ?? null; // リストのインデックス
                        const parentRef = { info: parentInfo, listIndex: parentListIndex };
                        const parentRefKey = createRefKey(parentInfo, parentListIndex);
                        let info = arrayElementBindingByParentRefKey.get(parentRefKey);
                        if (!info) {
                            info = {
                                parentRef,
                                listIndexes: [],
                                values: []
                            };
                            arrayElementBindingByParentRefKey.set(parentRefKey, info);
                        }
                        const refKey = createRefKey(item.info, item.listIndex);
                        const value = this.updatedValues[refKey] ?? null;
                        info.values?.push(value);
                        info.listIndexes?.push(item.listIndex);
                    }
                }
            }
            // リストインデックスの構築
            const builtStatePropertyRefKeySet = new Set();
            const affectedRefs = new Map();
            restructListIndexes(updatedRefs, engine, this.updatedValues, builtStatePropertyRefKeySet, affectedRefs);
            // スワップの場合の情報を構築する
            for (const [parentRefKey, info] of arrayElementBindingByParentRefKey) {
                const parentInfo = info.parentRef?.info ?? raiseError("parentInfo is null");
                const parentListIndex = info.parentRef?.listIndex ?? null;
                const bindings = engine.getBindings(parentInfo, parentListIndex);
                for (const binding of bindings) {
                    if (!binding.bindingNode.isFor) {
                        continue;
                    }
                    const bindingInfo = Object.assign({}, info, { binding });
                    retArrayElementBindings.push(bindingInfo);
                }
            }
            // 影響する全てのバインド情報を取得する
            for (const [info, listIndexes] of affectedRefs.entries()) {
                for (const listIndex of listIndexes) {
                    const bindings = engine.getBindings(info, listIndex);
                    retBindings.push(...bindings ?? []);
                    retProperties.push({ info, listIndex });
                }
            }
            retBindings.push(...bindingsByListIndex);
        }
        this.updatedValues = {};
        return {
            bindings: retBindings,
            arrayElementBindings: retArrayElementBindings,
            properties: retProperties
        };
    }
    render(bindings) {
        this.#version++;
        this.engine.readonlyState[SetCacheableSymbol](() => {
            return render(bindings);
        });
    }
}
export function createUpdater(engine) {
    return new Updater(engine);
}
