import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { IComponentPathInfo } from "./types";

class ComponentPathInfo implements IComponentPathInfo {
  path: string;
  info: IStructuredPathInfo;
  withGetter: boolean = false;
  withSetter: boolean = false;
  isList: boolean = false;
  existsUI: boolean = false;
  isTracked: boolean = false;
  optimized: boolean = false; // 最適化されたパス情報かどうか

  constructor(
    path: string, 
  ) {
    this.path = path;
    this.info = getStructuredPathInfo(path);
  }
}

export function createComponentPathInfo(path: string): IComponentPathInfo {
  return new ComponentPathInfo(path);
}