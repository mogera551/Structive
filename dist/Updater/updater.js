import { render } from "../Render/render.js";
import { SetCacheableSymbol } from "../StateClass/symbols.js";
import { raiseError } from "../utils.js";
import { getGlobalConfig } from "../WebComponents/getGlobalConfig.js";
import { restructListIndexes } from "./restructListIndex";
import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
class Updater {
    processList = [];
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
        this.processList.push(process);
        this.waitForQueueEntry.resolve();
    }
    addUpdatedStatePropertyRefValue(info, listIndex, value) {
        const refKey = createRefKey(info, listIndex);
        this.updatedProperties.add({ info, listIndex });
        this.updatedValues[refKey] = value;
        this.waitForQueueEntry.resolve();
    }
    addUpdatedListIndex(listIndex) {
        this.updatedProperties.add(listIndex);
        this.waitForQueueEntry.resolve();
    }
    terminate() {
        const waitForMainLoopTerminate = Promise.withResolvers();
        this.waitForQueueEntry.resolve(waitForMainLoopTerminate);
        return waitForMainLoopTerminate;
    }
    waitForQueueEntry = Promise.withResolvers();
    async main(waitForComponentInit) {
        await waitForComponentInit.promise;
        const config = getGlobalConfig();
        while (true) {
            try {
                const waitForMainLoopTerminate = await this.waitForQueueEntry.promise;
                config.debug && performance.mark(`start`);
                Updater.updatingCount++;
                try {
                    await this.exec();
                    if (config.debug) {
                        performance.mark(`end`);
                        performance.measure(`exec`, `start`, `end`);
                        console.log(performance.getEntriesByType("measure"));
                        performance.clearMeasures(`exec`);
                        performance.clearMarks(`start`);
                        performance.clearMarks(`end`);
                    }
                }
                finally {
                    Updater.updatingCount--;
                    if (waitForMainLoopTerminate) {
                        waitForMainLoopTerminate.resolve();
                        break;
                    }
                }
            }
            catch (e) {
                console.error(e);
            }
            finally {
                this.waitForQueueEntry = Promise.withResolvers();
            }
        }
    }
    async updateState() {
        while (this.processList.length > 0) {
            const processList = this.processList;
            this.processList = [];
            for (let i = 0; i < processList.length; i++) {
                const process = processList[i];
                await process();
            }
        }
    }
    async rebuild() {
        const retArrayElementBindings = [];
        const retBindings = [];
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
                }
            }
            retBindings.push(...bindingsByListIndex);
        }
        this.updatedValues = {};
        return { bindings: retBindings, arrayElementBindings: retArrayElementBindings };
    }
    async render(bindings) {
        this.#version++;
        await this.engine.stateProxy[SetCacheableSymbol](async () => {
            return render(bindings);
        });
    }
    async exec() {
        while (this.processList.length !== 0 || this.updatedProperties.size !== 0) {
            // update state
            await this.updateState();
            // rebuild
            const { bindings, arrayElementBindings } = await this.rebuild();
            // render
            for (const arrayElementBinding of arrayElementBindings) {
                arrayElementBinding.binding.bindingNode.updateElements(arrayElementBinding.listIndexes, arrayElementBinding.values);
            }
            if (bindings.length > 0) {
                await this.render(bindings);
            }
        }
    }
    static updatingCount = 0;
}
export function createUpdater(engine) {
    return new Updater(engine);
}
export function getUpdatingCount() {
    return Updater.updatingCount;
}
