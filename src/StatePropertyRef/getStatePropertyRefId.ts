import { getMaxListIndexId } from "../ListIndex/createListIndex.js";
import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";

/**
 * 参照用のIDを生成する
 * ListIndexのIDは最大値を取得してから計算するため、ListIndexの構築が完了していない場合、重複が発生する可能性がある
 */
/**
 * ToDo:ListIndexの構築が完了していない状態で、IDを取得すると例外を発生させる仕組みが必要
 */
export function getStatePropertyRefId(info: IStructuredPathInfo, listIndex: IListIndex | null): number {
  const listIndexMaxId = getMaxListIndexId();
  return info.id * (listIndexMaxId + 1) + (listIndex?.id ?? 0);
}