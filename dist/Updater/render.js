export function render(readonlyState, bindings) {
    const bindingsWithSelectElement = [];
    for (let i = 0; i < bindings.length; i++) {
        const binding = bindings[i];
        if (binding.bindingNode.isSelectElement) {
            bindingsWithSelectElement.push(binding);
        }
        else {
            binding.render(readonlyState);
        }
    }
    for (let i = 0; i < bindingsWithSelectElement.length; i++) {
        bindingsWithSelectElement[i].render(readonlyState);
    }
}
