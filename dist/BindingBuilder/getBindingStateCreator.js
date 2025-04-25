import { createBindingState } from "../DataBinding/BindingState/BindingState.js";
import { createBindingStateIndex } from "../DataBinding/BindingState/BindingStateIndex.js";
const ereg = new RegExp(/^\$\d+$/);
export function getBindingStateCreator(name, filterTexts) {
    if (ereg.test(name)) {
        return createBindingStateIndex(name, filterTexts);
    }
    else {
        return createBindingState(name, filterTexts);
    }
}
