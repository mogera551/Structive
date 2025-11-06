/**
 * setByRef.ts
 *
 * StateClassの内部APIとして、構造化パス情報（IStructuredPathInfo）とリストインデックス（IListIndex）を指定して
 * 状態オブジェクト（target）に値を設定するための関数（setByRef）の実装です。
 *
 * 主な役割:
 * - 指定されたパス・インデックスに対応するState値を設定（多重ループやワイルドカードにも対応）
 * - getter/setter経由で値設定時はSetStatePropertyRefSymbolでスコープを一時設定
 * - 存在しない場合は親infoやlistIndexを辿って再帰的に値を設定
 * - 設定後はengine.updater.addUpdatedStatePropertyRefValueで更新情報を登録
 *
 * 設計ポイント:
 * - ワイルドカードや多重ループにも柔軟に対応し、再帰的な値設定を実現
 * - finallyで必ず更新情報を登録し、再描画や依存解決に利用
 * - getter/setter経由のスコープ切り替えも考慮した設計
 */
import { createListIndex } from "../../ListIndex/ListIndex";
import { getStatePropertyRef } from "../../StatePropertyRef/StatepropertyRef";
import { IStatePropertyRef } from "../../StatePropertyRef/types";
import { IListInfo } from "../../Updater/types";
import { raiseError } from "../../utils.js";
import { GetByRefSymbol, GetListIndexesByRefSymbol } from "../symbols";
import { IStateProxy, IStateHandler } from "../types";
import { getByRef } from "./getByRef";

export function setByRef(
    target   : Object, 
    ref      : IStatePropertyRef,
    value    : any, 
    receiver : IStateProxy,
    handler  : IStateHandler
): any {
  const isElements = handler.engine.pathManager.elements.has(ref.info.pattern);
  let parentRef: IStatePropertyRef | null = null;
  let swapInfo: IListInfo | null = null;
  // elementsの場合はswapInfoを準備
  if (isElements) {
    parentRef = ref.parentRef ?? raiseError({
      code: 'STATE-202',
      message: 'propRef.stateProp.parentInfo is undefined',
      context: { where: 'setByRef (element)', refPath: ref.info.pattern },
      docsUrl: '/docs/error-codes.md#state',
    });
    swapInfo = handler.updater.swapInfoByRef.get(parentRef) || null;
    if (swapInfo === null) {
      swapInfo = {
        value: [...(receiver[GetByRefSymbol](parentRef) ?? [])],
        listIndexes: [...(receiver[GetListIndexesByRefSymbol](parentRef) ?? [])]
      }
      handler.updater.swapInfoByRef.set(parentRef, swapInfo);
    }
  }
  try {
    // 親子関係のあるgetterが存在する場合は、外部依存を通じて値を設定
    // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
    if (handler.engine.stateOutput.startsWith(ref.info) && handler.engine.pathManager.setters.intersection(ref.info.cumulativePathSet).size === 0) {
      return handler.engine.stateOutput.set(ref, value);
    }
    if (ref.info.pattern in target) {
      handler.refIndex++;
      if (handler.refIndex >= handler.refStack.length) {
        handler.refStack.push(null);
      }
      handler.refStack[handler.refIndex] = handler.lastRefStack = ref;
      try {
        return Reflect.set(target, ref.info.pattern, value, receiver);
      } finally {
        handler.refStack[handler.refIndex] = null;
        handler.refIndex--;
        handler.lastRefStack = handler.refIndex >= 0 ? handler.refStack[handler.refIndex] : null;
      }
    } else {
      const parentInfo = ref.info.parentInfo ?? raiseError({
        code: 'STATE-202',
        message: 'propRef.stateProp.parentInfo is undefined',
        context: { where: 'setByRef', refPath: ref.info.pattern },
        docsUrl: '/docs/error-codes.md#state',
      });
      const parentListIndex = parentInfo.wildcardCount < ref.info.wildcardCount ? (ref.listIndex?.parentListIndex ?? null) : ref.listIndex;
      const parentRef = getStatePropertyRef(parentInfo, parentListIndex);
      const parentValue = getByRef(target, parentRef, receiver, handler);
      const lastSegment = ref.info.lastSegment;
      if (lastSegment === "*") {
        const index = ref.listIndex?.index ?? raiseError({
          code: 'STATE-202',
          message: 'propRef.listIndex?.index is undefined',
          context: { where: 'setByRef', refPath: ref.info.pattern },
          docsUrl: '/docs/error-codes.md#state',
        });
        return Reflect.set(parentValue, index, value);
      } else {
        return Reflect.set(parentValue, lastSegment, value);
      }
    }
  } finally {
    handler.updater.enqueueRef(ref);
    if (isElements) {
      const index = swapInfo!.value.indexOf(value);
      const currentListIndexes = receiver[GetListIndexesByRefSymbol](parentRef!) ?? [];
      const curIndex = ref.listIndex!.index; 
      const listIndex = (index !== -1) ? swapInfo!.listIndexes[index] : createListIndex(parentRef!.listIndex, -1);
      currentListIndexes[curIndex] = listIndex;
      // 重複チェック
      // 重複していない場合、swapが完了したとみなし、インデックスを更新
      const listValueSet = new Set(receiver[GetByRefSymbol](parentRef!) ?? []);
      if (listValueSet.size === swapInfo!.value.length) {
        for(let i = 0; i < currentListIndexes.length; i++) {
          currentListIndexes[i].index = i;
        }
        // 完了したのでswapInfoを削除
        handler.updater.swapInfoByRef.delete(parentRef!);
      }
    }
  }
}
