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
}