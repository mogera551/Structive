import { IListIndex } from "../ListIndex/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { createRefKey, getStatePropertyRefKey } from "../StatePropertyRef/getStatePropertyRef";
import { Entry, IStateByRefKey } from "./types";

class StateByRefKey implements IStateByRefKey {
  map: Map<string, Entry> = new Map();

  exists(path: string, listIndex: IListIndex | null): boolean {
    const refKey = getStatePropertyRefKey(path, listIndex);
    return this.map.has(refKey);
  }
  getEntry(path: string, listIndex: IListIndex | null): Entry | null {
    const refKey = getStatePropertyRefKey(path, listIndex);
    return this.map.get(refKey) ?? null;
  }
  setEntry(path: string, listIndex: IListIndex | null, entry: Entry): void {
    const refKey = getStatePropertyRefKey(path, listIndex);
    this.map.set(refKey, entry);
  }
}
