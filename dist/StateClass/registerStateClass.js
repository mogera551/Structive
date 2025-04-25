import { raiseError } from "../utils.js";
const stateClassById = {};
export function registerStateClass(id, stateClass) {
    stateClassById[id] = stateClass;
}
export function getStateClassById(id) {
    return stateClassById[id] ?? raiseError(`getStateClassById: stateClass not found: ${id}`);
}
