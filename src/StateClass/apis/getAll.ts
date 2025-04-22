import { IListIndex } from "../../ListIndex/types";
import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { raiseError } from "../../utils";
import { IStateHandler, IStateProxy } from "../types";
import { resolve as _resolve } from "./resolve";

export function getAll(
  target: Object, 
  prop: PropertyKey, 
  receiver: IStateProxy,
  handler: IStateHandler
):Function {
    const resolve = _resolve(target, prop, receiver, handler);
    return (path: string, indexes?: number[]): any[] => {
      const info = getStructuredPathInfo(path);
      if (handler.lastTrackingStack != null && handler.lastTrackingStack !== info) {
        const lastPattern = handler.lastTrackingStack;
        if (lastPattern.parentInfo !== info) {
          handler.engine.addDependentProp(lastPattern, info);
        }
      }
  
      if (typeof indexes === "undefined") {
        for(let i = 0; i < info.wildcardInfos.length; i++) {
          const wildcardPattern = info.wildcardInfos[i] ?? raiseError(`wildcardPattern is null`);
          const listIndex = handler.engine.getContextListIndex(wildcardPattern.pattern);
          if (listIndex) {
            indexes = listIndex.indexes;
            break;
          }
        }
        if (typeof indexes === "undefined") {
          indexes = [];
        }
      }
      const walkWildcardPattern = (
        wildcardParentInfos: IStructuredPathInfo[],
        wildardIndexPos: number,
        listIndex: IListIndex | null,
        indexes: number[],
        indexPos: number,
        parentIndexes: number[],
        results: number[][]
      ) => {
        const wildcardParentPattern = wildcardParentInfos[wildardIndexPos] ?? null;
        if (wildcardParentPattern === null) {
          results.push(parentIndexes);
          return;
        }
        const listIndexSet = handler.engine.getListIndexesSet(wildcardParentPattern, listIndex) ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
        const listIndexes = Array.from(listIndexSet);
        const index = indexes[indexPos] ?? null;
        if (index === null) {
          for(let i = 0; i < listIndexes.length; i++) {
            const listIndex = listIndexes[i];
            walkWildcardPattern(
              wildcardParentInfos, 
              wildardIndexPos + 1, 
              listIndex, 
              indexes, 
              indexPos + 1, 
              parentIndexes.concat(listIndex.index),
              results);
          }
        } else {
          const listIndex = listIndexes[index] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
          if ((wildardIndexPos + 1) < wildcardParentInfos.length) {
            walkWildcardPattern(
              wildcardParentInfos, 
              wildardIndexPos + 1, 
              listIndex, 
              indexes, 
              indexPos + 1, 
              parentIndexes.concat(listIndex.index),
              results
            );
          }
        }
      }
      const resultIndexes: number[][] = [];
      walkWildcardPattern(
        info.wildcardParentInfos, 
        0, 
        null, 
        indexes, 
        0, 
        [], 
        resultIndexes
      );
      const resultValues: any[] = [];
      for(let i = 0; i < resultIndexes.length; i++) {
        resultValues.push(resolve(
          info.pattern,
          resultIndexes[i]
        ));
      }
      return resultValues;
    }
  }