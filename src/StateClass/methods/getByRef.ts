/**
 * getByRef.ts
 *
 * StateClassの内部APIとして、構造化パス情報（IStructuredPathInfo）とリストインデックス（IListIndex）を指定して
 * 状態オブジェクト（target）から値を取得するための関数（getByRef）の実装です。
 *
 * 主な役割:
 * - 指定されたパス・インデックスに対応するState値を取得（多重ループやワイルドカードにも対応）
 * - 依存関係の自動登録（trackedGetters対応時はsetTrackingでラップ）
 * - キャッシュ機構（handler.cacheable時はrefKeyで値をキャッシュ）
 * - getter経由で値取得時はSetStatePropertyRefSymbolでスコープを一時設定
 * - 存在しない場合は親infoやlistIndexを辿って再帰的に値を取得
 *
 * 設計ポイント:
 * - handler.engine.trackedGettersに含まれる場合はsetTrackingで依存追跡を有効化
 * - キャッシュ有効時はrefKeyで値をキャッシュし、取得・再利用を最適化
 * - ワイルドカードや多重ループにも柔軟に対応し、再帰的な値取得を実現
 * - finallyでキャッシュへの格納を保証
 */
import { IListIndex } from "../../ListIndex/types";
import { IStructuredPathInfo } from "../../StateProperty/types";
import { createRefKey } from "../../StatePropertyRef/getStatePropertyRef";
import { raiseError } from "../../utils";
import { SetStatePropertyRefSymbol } from "../symbols";
import { IStateHandler, IStateProxy } from "../types";
import { setTracking } from "./setTracking.js";

/**
 * 構造化パス情報(info, listIndex)をもとに、状態オブジェクト(target)から値を取得する。
 * 
 * - 依存関係の自動登録（trackedGetters対応時はsetTrackingでラップ）
 * - キャッシュ機構（handler.cacheable時はrefKeyでキャッシュ）
 * - ネスト・ワイルドカード対応（親infoやlistIndexを辿って再帰的に値を取得）
 * - getter経由で値取得時はSetStatePropertyRefSymbolでスコープを一時設定
 * 
 * @param target    状態オブジェクト
 * @param info      構造化パス情報
 * @param listIndex リストインデックス（多重ループ対応）
 * @param receiver  プロキシ
 * @param handler   状態ハンドラ
 * @returns         対象プロパティの値
 */
function _getByRef(
  target   : Object, 
  info     : IStructuredPathInfo,
  listIndex: IListIndex | null,
  receiver : IStateProxy,
  handler  : IStateHandler
): any {
  // 依存関係の自動登録
  if (handler.lastTrackingStack != null && handler.lastTrackingStack !== info) {
    const lastPattern = handler.lastTrackingStack;
    if (lastPattern.parentInfo !== info) {
      handler.engine.addDependentProp(lastPattern, info, "reference");
    }
  }

  // キャッシュが有効な場合はrefKeyで値をキャッシュ
  let refKey = '';
  if (handler.cacheable) {
    refKey = createRefKey(info, listIndex);
    const value = handler.cache[refKey];
    if (typeof value !== "undefined") {
      return value;
    }
    if (refKey in handler.cache) {
      return undefined;
    }
  }

  let value;
  try {
    // パターンがtargetに存在する場合はgetter経由で取得
    if (info.pattern in target) {
      return (value = receiver[SetStatePropertyRefSymbol](info, listIndex, () => {
        return Reflect.get(target, info.pattern, receiver);
      }));
    } else {
      // 存在しない場合は親infoを辿って再帰的に取得
      const parentInfo = info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
      const parentListIndex = parentInfo.wildcardCount < info.wildcardCount ? (listIndex?.parentListIndex ?? null) : listIndex;
      const parentValue = getByRef(target, parentInfo, parentListIndex, receiver, handler);
      const lastSegment = info.lastSegment;
      if (lastSegment === "*") {
        // ワイルドカードの場合はlistIndexのindexでアクセス
        const index = listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
        return (value = Reflect.get(parentValue, index));
      } else {
        // 通常のプロパティアクセス
        return (value = Reflect.get(parentValue, lastSegment));
      }
    }
  } finally {
    // キャッシュが有効な場合は取得値をキャッシュ
    if (handler.cacheable && !(refKey in handler.cache)) {
      handler.cache[refKey] = value;
    }
  }
}

/**
 * trackedGettersに含まれる場合は依存追跡(setTracking)を有効化し、値取得を行う。
 * それ以外は通常の_getByRefで取得。
 */
export function getByRef(
  target   : Object, 
  info     : IStructuredPathInfo,
  listIndex: IListIndex | null,
  receiver : IStateProxy,
  handler  : IStateHandler
): any {
  if (handler.engine.trackedGetters.has(info.pattern)) {
    return setTracking(info, handler, () => {
      return _getByRef(target, info, listIndex, receiver, handler);
    });
  } else {
    return _getByRef(target, info, listIndex, receiver, handler);
  }

}
