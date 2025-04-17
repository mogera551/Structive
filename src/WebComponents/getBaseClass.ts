import { Constructor } from "./types";

export function getBaseClass(extendTagName: string | null):Constructor<HTMLElement> {
  return extendTagName ? (document.createElement(extendTagName).constructor as Constructor<HTMLElement>) : HTMLElement;
}