
export type Dependencies<T = string> = Map<T, Set<T>>;

export interface IPathManager {
  alls: Set<string>;
  lists: Set<string>;
  elements: Set<string>;
  getters: Set<string>;
  setters: Set<string>;
  optimizes: Set<string>;
  staticDependencies: Dependencies<string>;
  dynamicDependencies: Dependencies<string>;
}