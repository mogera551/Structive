import { StructiveComponent } from "./types";

const parentStructiveComponentByStructiveComponent = new WeakMap<StructiveComponent, StructiveComponent>();

export function findStructiveParent(el:StructiveComponent): StructiveComponent | null {
  return parentStructiveComponentByStructiveComponent.get(el) ?? null;
}

export function registerStructiveComponent(parentComponent: StructiveComponent, component: StructiveComponent): void {
  parentStructiveComponentByStructiveComponent.set(component, parentComponent);
}