import { raiseError } from "../utils.js";

const styleSheetById: Record<number,CSSStyleSheet> = {};

export function registerStyleSheet(id: number, css: CSSStyleSheet) {
  styleSheetById[id] = css;
}

export function getStyleSheetById(id: number): CSSStyleSheet {
  return styleSheetById[id] ?? raiseError(`getStyleSheetById: stylesheet not found: ${id}`);
}