import { raiseError } from "../utils";
const styleSheetById = {};
export function registerStyleSheet(id, css) {
    styleSheetById[id] = css;
}
export function getStyleSheetById(id) {
    return styleSheetById[id] ?? raiseError(`getStyleSheetById: stylesheet not found: ${id}`);
}
