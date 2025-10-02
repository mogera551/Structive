import { IListIndex } from "../ListIndex/types";

/**
 * リスト差分の結果を表す構造体。
 *
 * - adds: 新規に追加されたインデックス集合
 * - removes: 削除されたインデックス集合
 * - changeIndexes: 位置が変更された（再利用される）要素のインデックス集合
 * - overwrites: 同じ位置に別の値が入った（上書き）インデックス集合
 *
 * 注意:
 * - adds/removes が空で changeIndexes のみ存在する場合、実質的にリオーダー（並べ替え）のみを意味します
 */
export interface IListDiff {
  oldListValue: any[] | undefined | null;
  newListValue: any[] | undefined | null;
  oldIndexes: IListIndex[];
  newIndexes: IListIndex[];
  adds?: Set<IListIndex>;
  removes?: Set<IListIndex>;
  changeIndexes?: Set<IListIndex>; // 位置が変わった要素
  overwrites?: Set<IListIndex>; // 要素の上書き
}
