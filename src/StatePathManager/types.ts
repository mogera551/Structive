
export interface IStatePathManager {
  alls: Set<string>;
  getters: Set<string>;
  setters: Set<string>;
  onlyGetters: Set<string>;
  optimizePaths: Set<string>;
}