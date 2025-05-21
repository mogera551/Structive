import { IBinding } from "../DataBinding/types";
import { IStateProxy } from "../StateClass/types";

export function render(readonlyState:IStateProxy, bindings: IBinding[]) {
  const bindingsWithSelectElement = [];
  for(let i = 0; i < bindings.length; i++) {
    const binding = bindings[i];
    if (binding.bindingNode.isSelectElement) {
      bindingsWithSelectElement.push(binding);
    } else {
      binding.render(readonlyState);
    }
  }
  for(let i = 0; i < bindingsWithSelectElement.length; i++) {
    bindingsWithSelectElement[i].render(readonlyState);
  }
}
