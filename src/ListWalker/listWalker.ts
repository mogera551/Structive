/**
 * listWalker.ts
 *
 * Stateプロパティのワイルドカード（配列・多重ループ）に対応したリスト探索ユーティリティです。
 *
 * 主な役割:
 * - 指定したプロパティパス（IStructuredPathInfo）とリストインデックス（IListIndex）に対し、
 *   再帰的に全てのリスト要素（多重ループ含む）を探索し、コールバックを実行
 * - ワイルドカード階層が一致した場合のみコールバックを呼び出し、それ以外は親階層を辿って再帰探索
 *
 * 設計ポイント:
 * - listWalkerSubで再帰的にリストインデックスを探索し、全要素に対してコールバックを適用
 * - listWalkerでエントリポイントを提供し、外部から簡単に利用可能
 * - 多重ループやネストした配列バインディングにも柔軟に対応
 */
import { IComponentEngine } from "../ComponentEngine/types";
import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { raiseError } from "../utils";

function listWalkerSub(
  engine: IComponentEngine,
  info: IStructuredPathInfo, 
  listIndex: IListIndex | null, 
  callback:(info: IStructuredPathInfo, listIndex: IListIndex | null)=> void
) {
  const listIndexLen = listIndex?.length ?? 0;
  if (info.wildcardCount === listIndexLen) {
    callback(info, listIndex);
  } else {
    const parentInfo = info.wildcardParentInfos[listIndexLen] ?? raiseError("Invalid state property info");
    const listIndexes = engine.getListIndexesSet(parentInfo, listIndex);
    for(const subListIndex of listIndexes ?? []) {
      listWalkerSub(engine, info, subListIndex, callback);
    }
  }
}

export function listWalker(
  engine: IComponentEngine,
  info:IStructuredPathInfo, 
  listIndex: IListIndex | null,
  callback:(info: IStructuredPathInfo, listIndex: IListIndex | null)=> void
) {
  listWalkerSub(engine, info, listIndex, callback);
}
