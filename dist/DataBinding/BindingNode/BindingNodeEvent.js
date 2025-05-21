import { createFilters } from "../../BindingBuilder/createFilters.js";
import { BindingNode } from "./BindingNode.js";
class BindingNodeEvent extends BindingNode {
    #subName;
    constructor(binding, node, name, filters, decorates) {
        super(binding, node, name, filters, decorates);
        this.#subName = this.name.slice(2); // on～
        const element = node;
        element.addEventListener(this.subName, (e) => this.handler(e));
    }
    get subName() {
        return this.#subName;
    }
    update() {
        // 何もしない
    }
    handler(e) {
        const bindingState = this.binding.bindingState;
        const engine = this.binding.engine;
        const stateProxy = engine.createWritableStateProxy();
        const updater = engine.updater;
        const loopContext = this.binding.parentBindContent.currentLoopContext;
        const indexes = loopContext?.serialize().map((context) => context.listIndex.index) ?? [];
        const options = this.decorates;
        if (options.includes("preventDefault")) {
            e.preventDefault();
        }
        if (options.includes("stopPropagation")) {
            e.stopPropagation();
        }
        this.binding.engine.updater.addProcess(async () => {
            const value = bindingState.value;
            const typeOfValue = typeof value;
            updater.addProcess(async () => {
                if (loopContext) {
                    await engine.setLoopContext(loopContext, async () => {
                        if (typeOfValue === "function") {
                            await Reflect.apply(value, stateProxy, [e, ...indexes]);
                        }
                        else {
                            // ToDo:error
                        }
                    });
                }
                else {
                    if (typeOfValue === "function") {
                        await Reflect.apply(value, stateProxy, [e, ...indexes]);
                    }
                    else {
                        // ToDo:error
                    }
                }
            });
        });
    }
}
export const createBindingNodeEvent = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeEvent(binding, node, name, filterFns, decorates);
};
