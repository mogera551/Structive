import { IDependencyEdge } from "../DependencyWalker/types";
import { IListIndex } from "../ListIndex/types";

/**
 * StateClassに関する情報を表すインターフェース。
 */
export interface IStateInfo {
  /**
   * 
   */
  paths: Set<string>;
  /**
   * getterだけを持つパスの集合。
   * これは、getterのみが存在し、setterが存在しないパスを示します。
   */
  getters: Set<string>;
  /**
   * getter/setterを持つパスの集合。
   */
  accessors: Set<string>;

  /**
   * 依存関係のマップ。
   * キーはパス名、値はそのパスに依存するエッジのセットです。
   */
  dependentTree: Map<string, Set<IDependencyEdge>>;

  listIndexByList: WeakMap<any[], Set<IListIndex>>; // リストインデックスを持つリストのマップ

  /**
   * リストパス
   */
  listPaths: Set<string>;
}