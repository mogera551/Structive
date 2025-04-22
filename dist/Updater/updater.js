import { render } from "../Render/render";
import { buildListIndexTree } from "../StateClass/buildListIndexTree";
import { SetCacheableSymbol } from "../StateClass/symbols";
import { getStatePropertyRefId } from "../StatePropertyRef/getStatePropertyRefId";
import { raiseError } from "../utils";
import { getGlobalConfig } from "../WebComponents/getGlobalConfig";
import { collectAffectedGetters } from "./collectAffectedGetters";
class Updater {
    processList = [];
    updatedProperties = new Set();
    updatedValues = {};
    engine;
    constructor(engine) {
        this.engine = engine;
    }
    addProcess(process) {
        this.processList.push(process);
        this.waitForQueueEntry.resolve();
    }
    addUpdatedStatePropertyRefValue(info, listIndex, value) {
        const refId = getStatePropertyRefId(info, listIndex);
        this.updatedProperties.add({ info, listIndex });
        this.updatedValues[refId] = value;
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
        const processedListIndexes = new Set();
        const processedPropertyRefIdsSet = new Set();
        while (this.updatedProperties.size > 0) {
            const updatedProiperties = Array.from(this.updatedProperties.values());
            const updatedRefs = []; // 更新されたプロパティ参照のリスト
            const arrayPropertyRefs = [];
            const arrayElementPropertyRefs = [];
            this.updatedProperties.clear();
            for (let i = 0; i < updatedProiperties.length; i++) {
                const item = updatedProiperties[i];
                let bindings;
                if ("index" in item) {
                    if (processedListIndexes.has(item))
                        continue;
                    const listIndex = item;
                    bindings = engine.bindingsByListIndex.get(listIndex);
                    processedListIndexes.add(listIndex);
                }
                else {
                    const statePropertyRefId = getStatePropertyRefId(item.info, item.listIndex);
                    if (processedPropertyRefIdsSet.has(statePropertyRefId))
                        continue;
                    const statePropertyRef = item;
                    if (engine.listInfoSet.has(statePropertyRef.info)) {
                        arrayPropertyRefs.push(statePropertyRef);
                    }
                    if (engine.elementInfoSet.has(statePropertyRef.info)) {
                        arrayElementPropertyRefs.push(statePropertyRef);
                    }
                    bindings = engine.getBindings(item.info, item.listIndex);
                    processedPropertyRefIdsSet.add(statePropertyRefId);
                    updatedRefs.push(statePropertyRef);
                }
                retBindings.push(...bindings ?? []);
            }
            // リストインデックスの構築
            const builtStatePropertyRefIds = new Set();
            for (let i = 0; i < arrayPropertyRefs.length; i++) {
                const arrayPropertyRef = arrayPropertyRefs[i];
                const statePropertyRefId = getStatePropertyRefId(arrayPropertyRef.info, arrayPropertyRef.listIndex);
                const value = this.updatedValues[statePropertyRefId] ?? null;
                buildListIndexTree(engine, arrayPropertyRef.info, arrayPropertyRef.listIndex, value);
                builtStatePropertyRefIds.add(statePropertyRefId);
            }
            const parentRefByRefId = {};
            const statePropertyRefByStatePropertyRefId = Object.groupBy(arrayElementPropertyRefs, ref => {
                if (ref.info.parentInfo === null)
                    raiseError(`parentInfo is null`);
                const parentInfo = ref.info.parentInfo;
                const parentListIndex = (ref.info.wildcardCount === ref.info.parentInfo.wildcardCount) ?
                    ref.listIndex : (ref.listIndex?.parentListIndex ?? null);
                const parentRefId = getStatePropertyRefId(parentInfo, parentListIndex);
                if (!(parentRefId in parentRefByRefId)) {
                    parentRefByRefId[parentRefId] = { info: parentInfo, listIndex: parentListIndex };
                }
                return parentRefId;
            });
            for (const [parentRefIdKey, refs] of Object.entries(statePropertyRefByStatePropertyRefId)) {
                const parentRefId = Number(parentRefIdKey);
                if (builtStatePropertyRefIds.has(parentRefId))
                    continue;
                if (typeof refs === "undefined")
                    continue;
                const parentRef = parentRefByRefId[parentRefId];
                if (parentRef === null)
                    continue;
                const values = [];
                const listIndexes = [];
                for (let j = 0; j < refs.length; j++) {
                    const ref = refs[j];
                    const statePropertyRefId = getStatePropertyRefId(ref.info, ref.listIndex);
                    const value = this.updatedValues[statePropertyRefId] ?? null;
                    values.push(value);
                    const listIndex = ref.listIndex;
                    if (listIndex === null) {
                        throw new Error("listIndex is null");
                    }
                    listIndexes.push(listIndex);
                }
                const bindings = engine.getBindings(parentRef.info, parentRef.listIndex);
                for (const binding of bindings) {
                    const arrayElementBinding = {
                        parentRef,
                        binding,
                        listIndexes,
                        values
                    };
                    retArrayElementBindings.push(arrayElementBinding);
                }
            }
            const updatingRefs = collectAffectedGetters(updatedRefs, engine);
            for (const updatingRef of updatingRefs) {
                const bindings = engine.getBindings(updatingRef.info, updatingRef.listIndex);
                retBindings.push(...bindings ?? []);
            }
        }
        this.updatedValues = {};
        return { bindings: retBindings, arrayElementBindings: retArrayElementBindings };
    }
    async render(bindings) {
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
