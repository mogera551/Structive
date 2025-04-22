import { StructiveComponentClass } from "./types";

export function registerComponentClass(tagName: string, componentClass: StructiveComponentClass) {
  componentClass.define(tagName);
}