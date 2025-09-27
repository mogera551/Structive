/**
 * getAll.ts
 *
 * StateClassのAPIとして、ワイルドカードを含むStateプロパティパスに対応した
 * 全要素取得関数（getAll）の実装です。
 *
 * 主な役割:
 * - 指定パス（path）に一致する全てのState要素を配列で取得
 * - 多重ループやワイルドカード（*）を含むパスにも対応
 * - indexes未指定時は現在のループコンテキストから自動でインデックスを解決
 *
 * 設計ポイント:
 * - getStructuredPathInfoでパス情報を解析し、依存関係も自動で登録
 * - walkWildcardPatternでワイルドカード階層を再帰的に探索し、全インデックス組み合わせを列挙
 * - resolveで各インデックス組み合わせに対応する値を取得し、配列で返却
 * - getContextListIndexで現在のループインデックスを取得
 * - handler.engine.getListIndexesSetで各階層のリストインデックス集合を取得
 */
import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo.js";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { raiseError } from "../../utils.js";
import { IReadonlyStateProxy, IReadonlyStateHandler } from "../types";
import { resolveReadonly } from "./resolveReadonly.js";
import { getContextListIndex } from "../methods/getContextListIndex";
import { IListIndex } from "../../ListIndex/types.js";
import { GetByRefSymbol } from "../symbols.js";
import { getStatePropertyRef } from "../../StatePropertyRef/StatepropertyRef.js";

export function getAllReadonly(
  target: Object, 
  prop: PropertyKey, 
  receiver: IReadonlyStateProxy,
  handler: IReadonlyStateHandler
):Function {
    const resolve = resolveReadonly(target, prop, receiver, handler);
    return (path: string, indexes?: number[]): any[] => {
      const info = getStructuredPathInfo(path);
      const lastInfo = handler.refStack[handler.refIndex]?.info ?? null;
      if (lastInfo !== null && lastInfo.pattern !== info.pattern) {
        // gettersに含まれる場合は依存関係を登録
        if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
          !handler.engine.pathManager.setters.has(lastInfo.pattern)) {
          handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, info.pattern);
        }
      }
  
      if (typeof indexes === "undefined") {
        for(let i = 0; i < info.wildcardInfos.length; i++) {
          const wildcardPattern = info.wildcardInfos[i] ?? raiseError(`wildcardPattern is null`);
          const listIndex = getContextListIndex(handler, wildcardPattern.pattern);
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
        let listIndexes = handler.engine.getListIndexes(wildcardParentPattern, listIndex);
        if (listIndexes === null) {
          const ref = getStatePropertyRef(wildcardParentPattern, listIndex);
          receiver[GetByRefSymbol](ref);
          listIndexes = handler.engine.getListIndexes(wildcardParentPattern, listIndex);
          if (listIndexes === null) {
            raiseError(`ListIndex is not found: ${wildcardParentPattern.pattern}`);
          }
        }
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