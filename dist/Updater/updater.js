import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
import { registerRender } from "./registerRender";
class Updater {
    processList = [];
    updatedProperties = new Set;
    updatedValues = {};
    engine;
    version = 0;
    #readonlyState;
    constructor(engine) {
        this.engine = engine;
        this.#readonlyState = engine.createReadonlyStateProxy();
    }
    get readonlyState() {
        return this.#readonlyState;
    }
    addProcess(process) {
        queueMicrotask(process);
    }
    addUpdatedStatePropertyRefValue(info, listIndex, value) {
        const refKey = createRefKey(info, listIndex);
        this.updatedProperties.add({ info, listIndex });
        this.updatedValues[refKey] = value;
        registerRender(this);
    }
    addUpdatedListIndex(listIndex) {
        this.updatedProperties.add(listIndex);
        registerRender(this);
    }
    getUpdatedProperties() {
        const updatedProperties = this.updatedProperties;
        this.updatedProperties = new Set();
        return updatedProperties;
    }
    static updatingCount = 0;
}
export function createUpdater(engine) {
    return new Updater(engine);
}
export function getUpdatingCount() {
    return Updater.updatingCount;
}
