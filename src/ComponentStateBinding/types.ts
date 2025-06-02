import { IBinding } from "../DataBinding/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { StructiveComponent } from "../WebComponents/types";

export interface IComponentStateBinding {
  childPaths: Set<string>;
  parentPaths: Set<string>;
  bindingByParentPath: Map<string, IBinding>;
  bindingByChildPath: Map<string, IBinding>;

  getChildPath(parentPath: string): string | undefined;
  getParentPath(childPath: string): string | undefined;
  toChildPathFromParentPath(parentPath: string): string;
  toParentPathFromChildPath(childPath: string): string;
  startsWithByChildPath(childPathInfo: IStructuredPathInfo): string | null;
  bind(parentComponent: StructiveComponent, childComponent: StructiveComponent): void;
}
