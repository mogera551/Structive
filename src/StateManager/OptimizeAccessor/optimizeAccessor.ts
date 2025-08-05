import { createAccessorFunctions } from "../../StateProperty/createAccessorFunctions";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { IStateManager } from "../types";

export function optimizeAccessor(
  stateClass: ObjectConstructor,
  pathInfo: IStructuredPathInfo,
  getterPaths: Set<string>
): boolean {
  const accessorFuncs = createAccessorFunctions(pathInfo, getterPaths);
  if (!accessorFuncs) {
    Object.defineProperty(stateClass.prototype, pathInfo.pattern, accessorFuncs);
    return true;
  }
  return false;
}
