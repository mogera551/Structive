import { IStructuredPathInfo } from "../StateProperty/types";
import { DependencyType, IDependencyEdge } from "./types";

export function createDependencyKey(info: IStructuredPathInfo, type: DependencyType): string {
  return `${info.pattern}@${type}`;
}

const cache: {[key:string]:IDependencyEdge} = {};;

export function createDependencyEdge(
  info: IStructuredPathInfo,
  type: DependencyType,
): IDependencyEdge {
  const key = createDependencyKey(info, type);
  return cache[key] ?? (cache[key] = { info, type });
}
