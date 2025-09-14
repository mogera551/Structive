
export type Dependencies<T = string> = Map<T, Set<T>>;

/**
 * パスマネージャー
 * ComponentClassごとに1つのインスタンスが生成される
 */
export interface IPathManager {
  /**
   * 全てのパスのセット
   */
  alls: Set<string>;
  /**
   * リストのパスのセット
   * {{ for: }}から取得される
   */
  lists: Set<string>;
  /**
   * リスト要素のパスのセット
   * リストパスから導出される
   */
  elements: Set<string>;
  /**
   * 関数のパスのセット
   */
  funcs: Set<string>;
  /**
   * getter定義のあるパスのセット
   * prototype.getDefinePropewrties()から取得される
   */
  getters: Set<string>;
  /**
   * setter定義のあるパスのセット
   * prototype.getDefinePropewrties()から取得される
   */
  setters: Set<string>;
  /**
   * 最適化されたgetter/setterパスのセット
   */
  optimizes: Set<string>;
  /**
   * 静的依存関係のマップ
   * key: 依存元のパス
   * value: 依存先のパスのセット
   */
  staticDependencies: Dependencies<string>;
  /**
   * 動的依存関係のマップ
   * key: 依存元のパス
   * value: 依存先のパスのセット
   */
  dynamicDependencies: Dependencies<string>;
  /**
   * 動的依存関係を追加する
   * @param target 依存先のパス
   * @param source 依存元のパス
   */
  addDynamicDependency(target: string, source: string): void;
}