import { raiseError } from "../utils";

const stateClassById: Record<number,typeof Object> = {};

export function registerStateClass(id: number, stateClass: typeof Object) {
  stateClassById[id] = stateClass;
}

export function getStateClassById(id: number): typeof Object {
  return stateClassById[id] ?? raiseError(`getStateClassById: stateClass not found: ${id}`);
}
