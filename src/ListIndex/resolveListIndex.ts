import { IComponentEngine } from "../ComponentEngine/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IListIndex } from "./types";

export function resolveListIndex(
  engine: IComponentEngine,
  path: string, indexes: number[],
): IListIndex | null {
  const info = getStructuredPathInfo(path);
  return null;

}
