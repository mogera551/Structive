/**
 * resolve.ts
 *
 * StateClassのAPIとして、パス（path）とインデックス（indexes）を指定して
 * Stateの値を取得・設定するための関数（resolve）の実装です。
 *
 * 主な役割:
 * - 文字列パス（path）とインデックス配列（indexes）から、該当するState値の取得・設定を行う
 * - ワイルドカードや多重ループを含むパスにも対応
 * - value未指定時は取得（getByRef）、指定時は設定（setByRef）を実行
 *
 * 設計ポイント:
 * - getStructuredPathInfoでパスを解析し、ワイルドカード階層ごとにリストインデックスを解決
 * - handler.engine.getListIndexesSetで各階層のリストインデックス集合を取得
 * - getByRef/setByRefで値の取得・設定を一元的に処理
 * - 柔軟なバインディングやAPI経由での利用が可能
 */
import { IListIndex } from "../../ListIndex/types";
import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo.js";
import { raiseError } from "../../utils.js";
import { IWritableStateProxy, IWritableStateHandler } from "../types";
import { setByRef } from "../methods/setByRef.js";
import { getByRefWritable } from "../methods/getByRefWritable";

export function resolveWritable(
  target: Object, 
  prop: PropertyKey, 
  receiver: IWritableStateProxy,
  handler: IWritableStateHandler
): Function {
  return (path: string, indexes: number[], value?: any): any => {
    const info = getStructuredPathInfo(path);
    let listIndex: IListIndex | null = null;
    for(let i = 0; i < info.wildcardParentInfos.length; i++) {
      const wildcardParentPattern = info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPath is null`);
      const listIndexes: IListIndex[] = Array.from(handler.engine.getListIndexesSet(wildcardParentPattern, listIndex) ?? []);
      const index = indexes[i] ?? raiseError(`index is null`);
      listIndex = listIndexes[index] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
    }
    if (typeof value === "undefined") {
      return getByRefWritable(target, info, listIndex, receiver, handler);
    } else {
      return setByRef(target, info, listIndex, value, receiver, handler);
    }
  };
} 