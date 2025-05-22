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
        this.bindingState = createBindingState(this, engine.readonlyState, engine.outputFilters);
    }
    get bindContents() {
        return this.bindingNode.bindContents;
    }
    init() {
        this.bindingNode.init();
        this.bindingState.init();
    }
    render() {
        if (this.version !== this.engine.updater.version) {
            try {
                this.bindingNode.update();
            }
            finally {
                this.version = this.engine.updater.version;
            }
        }
    }
    updateStateValue(writeState, value) {
        return this.bindingState.assignValue(writeState, value);
    }
}
export function createBinding(parentBindContent, node, engine, createBindingNode, createBindingState) {
    return new Binding(parentBindContent, node, engine, createBindingNode, createBindingState);
}
