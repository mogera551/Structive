/**
 * LoopContext/types.ts
 *
 * ループバインディング（for等）で利用するLoopContext（ループコンテキスト）管理用インターフェース定義です。
 *
 * 主な役割:
 * - ILoopContext: ループごとのプロパティパス・インデックス・BindContentを紐付けて管理するインターフェース
 *   - path: ループのプロパティパス
 *   - info: パスの構造化情報
 *   - bindContent: 対応するBindContentインスタンス
 *   - listIndex: 現在のリストインデックス
 *   - parentLoopContext: 親ループコンテキスト（多重ループ対応）
 *   - assignListIndex/clearListIndex: インデックスの再割り当て・クリア
 *   - find: 名前からループコンテキストを検索（キャッシュ付き）
 *   - walk: 階層をたどってコールバックを実行
 *   - serialize: ループ階層を配列で取得
 *
 * 設計ポイント:
 * - 多重ループやネストしたバインディング構造に柔軟に対応できる設計
 * - 親子関係や階層構造の探索・列挙・検索を効率的に行うためのインターフェース
 */
import { IBindContent } from "../DataBinding/types";
import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";

export interface ILoopContext {
  readonly ref              : IStatePropertyRef;
  readonly path             : string;
  readonly info             : IStructuredPathInfo;
  readonly bindContent      : IBindContent;
  readonly listIndex        : IListIndex;
  readonly parentLoopContext: ILoopContext | null;
  assignListIndex(listIndex: IListIndex): void;
  clearListIndex(): void;
  find(name: string): ILoopContext | null;
  walk(callback: (loopContext: ILoopContext) => void): void;
  serialize(): ILoopContext[];
  
}

