import { QuelComponentClasses } from "./types";

export function registerComponentClasses(componentClasses:QuelComponentClasses) {
  Object.entries(componentClasses).forEach(([tagName, componentClass]) => {
    componentClass.define(tagName);
  });
}