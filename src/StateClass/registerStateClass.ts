import { raiseError } from "../utils";
import { IStructiveState } from "./types";

const stateClassById: Record<number,IStructiveState> = {};

export function registerStateClass(id: number, stateClass: IStructiveState) {
  stateClassById[id] = stateClass;
}

export function getStateClassById(id: number): IStructiveState {
  return stateClassById[id] ?? raiseError(`getStateClassById: stateClass not found: ${id}`);
}
