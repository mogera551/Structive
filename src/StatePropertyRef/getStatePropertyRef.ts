/**
 * getStatePropertyRef.ts
 *
 * StatePropertyRefのユーティリティとして、構造化パス情報（IStructuredPathInfo）と
 * リストインデックス（IListIndex）から一意な参照キー（refKey）を生成する関数です。
 *
 * 主な役割:
 * - info.idとlistIndex.idを組み合わせて、StatePropertyRefを一意に識別するキーを生成
 * - listIndexがnullの場合は0を利用し、全ての参照に対して一貫したキーを提供
 *
 * 設計ポイント:
 * - キャッシュや依存解決など、StatePropertyRefの識別・管理に利用
 * - シンプルな文字列連結で高速かつ衝突のないキー生成を実現
 */
import { IListIndex2 } from "../ListIndex2/types";
import { IStructuredPathInfo } from "../StateProperty/types";

export function createRefKey(
  info: IStructuredPathInfo,
  listIndex: IListIndex2 | null,
) {
  return (listIndex == null) ? info.sid : (info.sid + "#" + listIndex.sid);
}

