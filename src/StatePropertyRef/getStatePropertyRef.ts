import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";

export function createRefKey(
  info: IStructuredPathInfo,
  listIndex: IListIndex | null,
) {
  return info.id + ":" + (listIndex?.id ?? 0);
}

