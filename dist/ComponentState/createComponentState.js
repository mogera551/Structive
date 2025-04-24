import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
class ComponentState {
    engine;
    constructor(engine) {
        this.engine = engine;
    }
    render(name, value) {
        // @ts-ignore
        // render
        const info = getStructuredPathInfo(name);
        this.engine.updater.addUpdatedStatePropertyRefValue(info, null, value);
    }
}
export const createComponentState = (engine) => {
    return new ComponentState(engine);
};
