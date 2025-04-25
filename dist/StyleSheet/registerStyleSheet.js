import { raiseError } from "../utils.js";
const styleSheetById = {};
export function registerStyleSheet(id, css) {
    styleSheetById[id] = css;
}
export function getStyleSheetById(id) {
    return styleSheetById[id] ?? raiseError(`getStyleSheetById: stylesheet not found: ${id}`);
}
