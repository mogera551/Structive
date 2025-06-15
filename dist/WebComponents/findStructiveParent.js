const parentStructiveComponentByStructiveComponent = new WeakMap();
export function findStructiveParent(el) {
    return parentStructiveComponentByStructiveComponent.get(el) ?? null;
}
export function registerStructiveComponent(parentComponent, component) {
    parentStructiveComponentByStructiveComponent.set(component, parentComponent);
}
