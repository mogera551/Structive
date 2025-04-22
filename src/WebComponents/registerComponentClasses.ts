import { StructiveComponentClasses } from "./types";

export function registerComponentClasses(componentClasses:StructiveComponentClasses) {
  Object.entries(componentClasses).forEach(([tagName, componentClass]) => {
    componentClass.define(tagName);
  });
}