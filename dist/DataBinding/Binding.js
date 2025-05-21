class Binding {
    parentBindContent;
    node;
    engine;
    bindingNode;
    bindingState;
    version;
    constructor(parentBindContent, node, engine, createBindingNode, createBindingState) {
        this.parentBindContent = parentBindContent;
        this.node = node;
        this.engine = engine;
        this.bindingNode = createBindingNode(this, node, engine.inputFilters);
        this.bindingState = createBindingState(this, engine.stateProxy, engine.outputFilters);
    }
    get bindContents() {
        return this.bindingNode.bindContents;
    }
    init() {
        this.bindingNode.init();
        this.bindingState.init();
    }
    render(readonlyState) {
        if (this.version === this.engine.updater.version)
            return;
        try {
            this.bindingNode.update(readonlyState);
        }
        finally {
            this.version = this.engine.updater.version;
        }
    }
    updateStateValue(writableState, value) {
        const engine = this.engine;
        const bindingState = this.bindingState;
        engine.updater.addProcess(() => {
            return bindingState.assignValue(writableState, value);
        });
    }
}
export function createBinding(parentBindContent, node, engine, createBindingNode, createBindingState) {
    return new Binding(parentBindContent, node, engine, createBindingNode, createBindingState);
}
