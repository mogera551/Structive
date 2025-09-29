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
import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo.js";
import { raiseError } from "../../utils.js";
import { IReadonlyStateProxy, IReadonlyStateHandler, IWritableStateHandler, IWritableStateProxy } from "../types";
import { getByRefReadonly } from "../methods/getByRefReadonly";
import { IListIndex } from "../../ListIndex/types.js";
import { getStatePropertyRef } from "../../StatePropertyRef/StatepropertyRef.js";
import { IComponentEngine } from "../../ComponentEngine/types.js";
import { IStatePropertyRef } from "../../StatePropertyRef/types.js";
import { getByRefWritable } from "../methods/getByRefWritable.js";
import { SetCacheableSymbol } from "../symbols.js";
import { set } from "../traps/set.js";
import { setByRef } from "../methods/setByRef.js";

type StateHandler = IReadonlyStateHandler | IWritableStateHandler;
type StateProxy = IReadonlyStateProxy | IWritableStateProxy;

export function resolve(
  target: Object, 
  prop: PropertyKey, 
  receiver: StateProxy,
  handler: StateHandler
): Function {
  return (path: string, indexes: number[], value?: any): any => {
    const info = getStructuredPathInfo(path);
    const lastInfo = handler.lastRefStack?.info ?? null;
    if (lastInfo !== null && lastInfo.pattern !== info.pattern) {
      // gettersに含まれる場合は依存関係を登録
      if (handler.engine.pathManager.getters.has(lastInfo.pattern) &&
        !handler.engine.pathManager.setters.has(lastInfo.pattern)) {
        handler.engine.pathManager.addDynamicDependency(lastInfo.pattern, info.pattern);
      }
    }

    if (info.wildcardParentInfos.length > indexes.length) {
      raiseError(`indexes length is insufficient: ${path}`);
    }
    // ワイルドカード階層ごとにListIndexを解決していく
    let listIndex: IListIndex | null = null;
    for(let i = 0; i < info.wildcardParentInfos.length; i++) {
      const wildcardParentPattern = info.wildcardParentInfos[i];
      const wildcardRef = getStatePropertyRef(wildcardParentPattern, listIndex);
      const listIndexes: IListIndex[] = handler.engine.getListIndexes(wildcardRef) ?? raiseError(`ListIndexes not found: ${wildcardParentPattern.pattern}`);
      const index = indexes[i];
      listIndex = listIndexes[index] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
    }

    // WritableかReadonlyかを判定して適切なメソッドを呼び出す
    const ref = getStatePropertyRef(info, listIndex);
    const hasSetValue = typeof value !== "undefined";
    if (SetCacheableSymbol in receiver && "cache" in handler) {
      if (!hasSetValue) {
        return getByRefReadonly(target, ref, receiver, handler);
      } else {
        // readonlyなので、setはできない
        raiseError(`Cannot set value on a readonly proxy: ${path}`);
      }
    } else if (!(SetCacheableSymbol in receiver) && !("cache" in handler)) {
      if (!hasSetValue) {
        return getByRefWritable(target, ref, receiver, handler);
      } else {
        setByRef(target, ref, value, receiver, handler);
      }
    } else {
      raiseError("Inconsistent proxy and handler types.");
    }
  };
} 