import { IBinding } from "../DataBinding/types";

export function render(bindings: IBinding[]) {
  const bindingsWithSelectElement = [];
  for(let i = 0; i < bindings.length; i++) {
    const binding = bindings[i];
    if (binding.bindingNode.isSelectElement) {
      bindingsWithSelectElement.push(binding);
    } else {
      binding.render();
    }
  }
  for(let i = 0; i < bindingsWithSelectElement.length; i++) {
    bindingsWithSelectElement[i].render();
  }
}
