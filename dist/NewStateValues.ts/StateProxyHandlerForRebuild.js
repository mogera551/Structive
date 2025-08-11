class StateProxyHandlerForRebuild {
    #stateValueManager;
    constructor(stateValueManager) {
        this.#stateValueManager = stateValueManager;
    }
    get(target, prop, receiver) {
    }
}
export {};
