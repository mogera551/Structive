
export interface IStatePathManager {
  alls: Set<string>;
  getters: Set<string>;
  lists: Set<string>;
  elements: Set<string>;

  staticDependencies: Map<string, Set<string>>;
  dynamicDependencies: Map<string, Set<string>>;
  addStaticDependency(from: string, refto: string): void;
  addDynamicDependency(from: string, refto: string): void;
}
