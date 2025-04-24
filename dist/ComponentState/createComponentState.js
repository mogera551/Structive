import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { BindParentComponentSymbol, RenderSymbol } from "./symbols";
class ComponentState {
    engine;
    constructor(engine) {
        this.engine = engine;
    }
    bindParentProperty(binding) {
        const propName = binding.bindingNode.subName;
        Object.defineProperty(this.engine.state, propName, {
            get: () => {
                return binding.bindingState.filteredValue;
            },
            set: (value) => {
                return binding.updateStateValue(value);
            },
        });
    }
    bindParentComponent() {
        // bindParentComponent
        const parent = this.engine.owner.parentStructiveComponent;
        if (parent === null) {
            return;
        }
        const bindings = parent.getBindingsFromChild(this.engine.owner);
        for (const binding of bindings ?? []) {
            this.bindParentProperty(binding);
        }
    }
    render(name, value) {
        // render
        const info = getStructuredPathInfo(name);
        this.engine.updater.addUpdatedStatePropertyRefValue(info, null, value);
    }
    getPropertyValue(name) {
        // getPropertyValue
        const info = getStructuredPathInfo(name);
        return this.engine.getPropertyValue(info, null);
    }
    setPropertyValue(name, value) {
        // setPropertyValue
        const info = getStructuredPathInfo(name);
        this.engine.setPropertyValue(info, null, value);
    }
}
class ComponentStateHandler {
    get(state, prop, receiver) {
        if (prop === RenderSymbol) {
            return state.render.bind(state);
        }
        else if (prop === BindParentComponentSymbol) {
            return state.bindParentComponent.bind(state);
        }
        else if (typeof prop === 'string') {
            return state.getPropertyValue(prop);
        }
        else {
            return Reflect.get(state, prop, receiver);
        }
    }
    set(state, prop, value, receiver) {
        if (typeof prop === 'string') {
            state.setPropertyValue(prop, value);
            return true;
        }
        else {
            return Reflect.set(state, prop, value, receiver);
        }
    }
}
;
export const createComponentState = (engine) => {
    return new Proxy(new ComponentState(engine), new ComponentStateHandler());
};
