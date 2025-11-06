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
import { ICacheEntry } from "../../ComponentEngine/types";
import { IStatePropertyRef } from "../../StatePropertyRef/types";
import { raiseError } from "../../utils";
import { IStateProxy, IStateHandler } from "../types";
import { checkDependency } from "./checkDependency";
import { createListIndexes } from "./createListIndexes";

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
export function getByRef(
  target   : Object, 
  ref      : IStatePropertyRef,
  receiver : IStateProxy,
  handler  : IStateHandler
): any {
  checkDependency(handler, ref);

  let value: any;
  const listable = handler.engine.pathManager.lists.has(ref.info.pattern);
  const cacheable = ref.info.wildcardCount > 0 || 
                    handler.engine.pathManager.getters.has(ref.info.pattern);
  let lastCacheEntry = null;
  if (cacheable || listable) {
    lastCacheEntry = handler.engine.getCacheEntry(ref);
    const versionRevision = handler.engine.versionRevisionByPath.get(ref.info.pattern);
    if (lastCacheEntry !== null) {
      if (typeof versionRevision === "undefined") {
        // 更新なし
        return lastCacheEntry.value;
      } else {
        if (lastCacheEntry.version > handler.updater.version) {
          // これは非同期更新が発生した場合にありえる
          return lastCacheEntry.value;
        }
        if (lastCacheEntry.version < versionRevision.version || lastCacheEntry.revision < versionRevision.revision) {
          // 更新あり
        } else {
          return lastCacheEntry.value;
        }
      }
    }
  }

  // 親子関係のあるgetterが存在する場合は、外部依存から取得
  // ToDo: stateにgetterが存在する（パスの先頭が一致する）場合はgetter経由で取得
  if (handler.engine.stateOutput.startsWith(ref.info) && handler.engine.pathManager.getters.intersection(ref.info.cumulativePathSet).size === 0) {
    return handler.engine.stateOutput.get(ref);
  }

  // パターンがtargetに存在する場合はgetter経由で取得
  if (ref.info.pattern in target) {
    if (handler.refStack.length === 0) {
      raiseError({
        code: 'STC-002',
        message: 'handler.refStack is empty in getByRef',
      });
    }
    handler.refIndex++;
    if (handler.refIndex >= handler.refStack.length) {
      handler.refStack.push(null);
    }
    handler.refStack[handler.refIndex] = handler.lastRefStack = ref;
    try {
      return value = Reflect.get(target, ref.info.pattern, receiver);
    } finally {
      handler.refStack[handler.refIndex] = null;
      handler.refIndex--;
      handler.lastRefStack = handler.refIndex >= 0 ? handler.refStack[handler.refIndex] : null;
      // キャッシュへ格納
      if (cacheable || listable) {
        let newListIndexes = null;
        if (listable) {
          // リストインデックスを計算する必要がある
          if (handler.renderer !== null) {
            if (!handler.renderer.lastListInfoByRef.has(ref)) {
              const listInfo = {
                listIndexes: lastCacheEntry?.listIndexes ?? [],
                value: lastCacheEntry?.value,
              };
              handler.renderer.lastListInfoByRef.set(ref, listInfo);
            }
          }
          newListIndexes = createListIndexes(ref.listIndex, lastCacheEntry?.value, value, lastCacheEntry?.listIndexes ?? []);
        }
        let cacheEntry: ICacheEntry = lastCacheEntry ?? {
          value: null,
          listIndexes: null,
          version: 0,
          revision: 0,
        };
        cacheEntry.value = value;
        cacheEntry.listIndexes = newListIndexes;
        cacheEntry.version = handler.updater.version;
        cacheEntry.revision = handler.updater.revision;
        handler.engine.setCacheEntry(ref, cacheEntry);
      }
    }
  } else {
    // 存在しない場合エラー
    raiseError({
      code: "STC-001",
      message: `Property "${ref.info.pattern}" does not exist in state.`,
      docsUrl: "./docs/error-codes.md#stc",
    })
  }
}
