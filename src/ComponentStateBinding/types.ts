import { IBinding } from "../DataBinding/types";
import { IStructuredPathInfo } from "../StateProperty/types";

export interface IComponentStateBinding {
  childPaths: Set<string>;
  parentPaths: Set<string>;
  bindingByParentPath: Map<string, IBinding>;
  bindingByChildPath: Map<string, IBinding>;

  addBinding(binding: IBinding): void;
  add(parentPath: string, childPath: string): void;
  getChildPath(parentPath: string): string | undefined;
  getParentPath(childPath: string): string | undefined;
  toChildPathFromParentPath(parentPath: string): string;
  toParentPathFromChildPath(childPath: string): string;
  startsWithByChildPath(childPathInfo: IStructuredPathInfo): string | null;
}
