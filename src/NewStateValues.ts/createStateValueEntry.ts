import { IListIndex } from "../ListIndex/types";
import { IStructuredPathInfo } from "../StateProperty/types";
import { primitive } from "../types";
import { IStateValueEntry } from "./types";

class StateValueEntry implements IStateValueEntry {
  version: number;
  info: IStructuredPathInfo;
  #listIndex: WeakRef<IListIndex> | null;
  #value: WeakRef<any> | primitive;

  constructor(version: number, info: IStructuredPathInfo, listIndex: IListIndex | null, value: Object | primitive) {
    this.version = version;
    this.info = info;
    this.#listIndex = (listIndex !== null) ? new WeakRef(listIndex) : null;
    this.#value = (value instanceof Object) ? new WeakRef(value) : value;
  }

  get listIndex(): IListIndex | null {
    return (this.#listIndex instanceof WeakRef) ? (this.#listIndex.deref() ?? null) : null;
  }

  getValue(version: number): any {
    if (this.version > version) {
      throw new Error(`Entry version ${this.version} is greater than requested version ${version}`);
    }
    return (this.#value instanceof WeakRef) ? (this.#value.deref() ?? null) : null;

  }
  setValue(version: number, value: any): void {
    if (this.version > version) {
      throw new Error(`Entry version ${this.version} is greater than requested version ${version}`);
    }
    this.version = version;
    this.#value = (value instanceof Object) ? value : new WeakRef(value);
  }

}

export function createStateValueEntry(
  version: number,
  info: IStructuredPathInfo,
  listIndex: IListIndex | null,
  value: Object | primitive
): IStateValueEntry {
  return new StateValueEntry(version, info, listIndex, value);
}
