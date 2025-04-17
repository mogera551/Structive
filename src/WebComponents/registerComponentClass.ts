import { QuelComponentClass } from "./types";

export function registerComponentClass(tagName: string, componentClass: QuelComponentClass) {
  componentClass.define(tagName);
}