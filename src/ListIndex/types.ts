/**
 * ListIndex/types.ts
 *
 * リストバインディングや多重ループ処理で利用する「リストインデックス」管理用インターフェース定義です。
 *
 * 主な役割:
 * - IListIndex: ネストしたリストやループのインデックス情報をツリー構造で管理するためのインターフェース
 *   - parentListIndex: 親のリストインデックス（多重ループ対応）
 *   - index: 現在のインデックス値
 *   - id: 一意なID
 *   - indexes: ルートから現在までのインデックス配列
 *   - position: ルートからの相対位置
 *   - length: インデックスの階層数
 *   - truncate: 指定階層までの親ListIndexを取得
 *   - add: 子ListIndexを生成
 *   - reverseIterator/iterator: 親子関係を辿るイテレータ
 *   - toString: インデックス情報の文字列表現
 *   - at: 指定位置のListIndexを取得
 *
 * 設計ポイント:
 * - 多重ループやforバインディング時のインデックス管理を柔軟かつ型安全に行うための設計
 * - イテレータやキャッシュを活用し、効率的なインデックス参照が可能
 */
export interface IListIndex {
  parentListIndex: IListIndex | null;
  index          : number;
  readonly id      : number;
  readonly sid     : string; // Unique ID as a string
  readonly indexes : number[];
  readonly position: number;
  readonly length: number;
  truncate(length: number): IListIndex | null;
  add(value: number): IListIndex;
  reverseIterator(): Generator<IListIndex>;
  iterator(): Generator<IListIndex>;
  toString(): string;
  at(position: number): IListIndex | null;
}
