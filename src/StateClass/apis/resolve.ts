import { IListIndex } from "../../ListIndex/types";
import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo";
import { raiseError } from "../../utils";
import { IStateHandler, IStateProxy } from "../types";
import { getByRef } from "../methods/getByRef";
import { setByRef } from "../methods/setByRef";

export function resolve(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
):Function {
  return (path: string, indexes: number[], value?:any): any => {
    const info = getStructuredPathInfo(path);
    let listIndex: IListIndex | null = null;
    for(let i = 0; i < info.wildcardParentInfos.length; i++) {
      const wildcardParentPattern = info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPath is null`);
      const listIndexes: IListIndex[] = Array.from(handler.engine.getListIndexesSet(wildcardParentPattern, listIndex) ?? []);
      const index = indexes[i] ?? raiseError(`index is null`);
      listIndex = listIndexes[index] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
    }
    if (typeof value === "undefined") {
      return getByRef(target, info, listIndex, receiver, handler);
    } else {
      return setByRef(target, info, listIndex, value, receiver, handler);
    }
  };
} 