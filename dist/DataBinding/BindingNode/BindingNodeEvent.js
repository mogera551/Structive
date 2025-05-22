import { createFilters } from "../../BindingBuilder/createFilters.js";
import { SetLoopContextSymbol } from "../../StateClass/symbols.js";
import { raiseError } from "../../utils.js";
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
        const engine = this.binding.engine;
        const loopContext = this.binding.parentBindContent.currentLoopContext;
        const indexes = loopContext?.serialize().map((context) => context.listIndex.index) ?? [];
        const options = this.decorates;
        const value = this.binding.bindingState.value;
        const typeOfValue = typeof value;
        if (typeOfValue !== "function") {
            raiseError(`BindingNodeEvent: ${this.name} is not a function.`);
        }
        if (options.includes("preventDefault")) {
            e.preventDefault();
        }
        if (options.includes("stopPropagation")) {
            e.stopPropagation();
        }
        this.binding.engine.updater.addProcess(async () => {
            const stateProxy = engine.createWritableStateProxy();
            await stateProxy[SetLoopContextSymbol](loopContext, async () => {
                await Reflect.apply(value, stateProxy, [e, ...indexes]);
            });
        });
    }
}
export const createBindingNodeEvent = (name, filterTexts, decorates) => (binding, node, filters) => {
    const filterFns = createFilters(filters, filterTexts);
    return new BindingNodeEvent(binding, node, name, filterFns, decorates);
};
