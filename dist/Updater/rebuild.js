import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
import { raiseError } from "../utils";
import { restructListIndexes } from "./restructListIndex";
export function rebuild(updater) {
    const retArrayElementBindings = [];
    const retBindings = [];
    const engine = updater.engine;
    const updatedPropertiesSet = updater.getUpdatedProperties();
    const updatedProiperties = Array.from(updatedPropertiesSet.values());
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
                const value = updater.updatedValues[refKey] ?? null;
                info.values?.push(value);
                info.listIndexes?.push(item.listIndex);
            }
        }
    }
    // リストインデックスの構築
    const builtStatePropertyRefKeySet = new Set();
    const affectedRefs = new Map();
    restructListIndexes(updatedRefs, updater.readonlyState, engine, updater.updatedValues, builtStatePropertyRefKeySet, affectedRefs);
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
        }
    }
    retBindings.push(...bindingsByListIndex);
    return { bindings: retBindings, arrayElementBindings: retArrayElementBindings };
}
