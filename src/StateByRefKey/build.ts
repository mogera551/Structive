import { IComponentPathManager } from "../ComponentPath/types";
import { IListIndex } from "../ListIndex/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { createEntry } from "./Entry";
import { IStateByRefKey } from "./types";

/**
 * Builds the state by reference key.
 * @param stateByRefKey 
 * @param pathManager 
 * @param path 
 * @param listIndex 
 * @param value 
 * @param version 
 */
export function build(
  stateByRefKey: IStateByRefKey,
  pathManager: IComponentPathManager,
  path: string,
  listIndex: IListIndex | null,
  value: any,
  version: number,
) {
  let entry = stateByRefKey.getEntry(path, listIndex);
  if (!entry) {
    // ToDo: parentEntryの取得方法を検討する
    const parentEntry = null; // ここは適切な親エントリを
    entry = createEntry(
      parentEntry,
      path,
      listIndex,
      value,
      version
    )
    stateByRefKey.setEntry(path, listIndex, entry);
  }
  entry.setValue(value, version);
}