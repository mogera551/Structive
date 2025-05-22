import { IListIndex } from "../../ListIndex/types";
import { IStateHandler } from "../types";
import { getLastStatePropertyRef } from "./getLastStatePropertyRef";

export function getContextListIndex(
  handler: IStateHandler,
  structuredPath: string
): IListIndex | null {
  const lastRef = getLastStatePropertyRef(handler);
  if (lastRef === null) {
    return null;
  }
  const info = lastRef.info;
  const index = info.wildcardPaths.indexOf(structuredPath);
  if (index >= 0) {
    return lastRef.listIndex?.at(index) ?? null;
  }
  return null;
}
