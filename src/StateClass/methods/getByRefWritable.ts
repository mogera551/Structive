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
import { raiseError } from "../../utils";
import { IWritableStateHandler, IWritableStateProxy } from "../types";
import { setStatePropertyRef } from "./setStatePropertyRef";
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
  receiver : IWritableStateProxy,
  handler  : IWritableStateHandler
): any {
  // 親子関係のあるgetterが存在する場合は、外部依存から取得
  // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
  if (handler.engine.stateOutput.startsWith(info) && handler.engine.getters.intersection(info.cumulativePathSet).size === 0) {
    return handler.engine.stateOutput.get(info, listIndex);
  }

  // パターンがtargetに存在する場合はgetter経由で取得
  if (info.pattern in target) {
    return setStatePropertyRef(handler, info, listIndex, () => {
      return Reflect.get(target, info.pattern, receiver);
    });
  } else {
    // 存在しない場合は親infoを辿って再帰的に取得
    const parentInfo = info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
    const parentListIndex = parentInfo.wildcardCount < info.wildcardCount ? (listIndex?.parentListIndex ?? null) : listIndex;
    const parentValue = getByRefWritable(target, parentInfo, parentListIndex, receiver, handler);
    const lastSegment = info.lastSegment;
    if (lastSegment === "*") {
      // ワイルドカードの場合はlistIndexのindexでアクセス
      const index = listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
      return Reflect.get(parentValue, index);
    } else {
      // 通常のプロパティアクセス
      return Reflect.get(parentValue, lastSegment);
    }
  }
}

/**
 * trackedGettersに含まれる場合は依存追跡(setTracking)を有効化し、値取得を行う。
 * それ以外は通常の_getByRefで取得。
 */
export function getByRefWritable(
  target   : Object, 
  info     : IStructuredPathInfo,
  listIndex: IListIndex | null,
  receiver : IWritableStateProxy,
  handler  : IWritableStateHandler
): any {
  return setTracking(info, handler, () => {
    return _getByRef(target, info, listIndex, receiver, handler);
  });
}
