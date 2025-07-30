import { IListIndex } from "../ListIndex/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { createRefKey, getStatePropertyRefKey } from "../StatePropertyRef/getStatePropertyRef";
import { IEntry, IStateByRefKey } from "./types";

class StateByRefKey implements IStateByRefKey {
  listIndexesByListValue: Map<Array<any>, Set<IListIndex>> = new Map();
  map: Map<string, IEntry> = new Map();
  exists(path: string, listIndex: IListIndex | null): boolean {
    const refKey = getStatePropertyRefKey(path, listIndex);
    return this.map.has(refKey);
  }
  getEntry(path: string, listIndex: IListIndex | null): IEntry | null {
    const refKey = getStatePropertyRefKey(path, listIndex);
    return this.map.get(refKey) ?? null;
  }
  setEntry(path: string, listIndex: IListIndex | null, entry: IEntry): void {
    const refKey = getStatePropertyRefKey(path, listIndex);
    this.map.set(refKey, entry);
  }
}
