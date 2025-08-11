import { IListIndex } from "../ListIndex/types";
import { IStatePathManager } from "../NewStatePathManager/types";
import { IState } from "../StateClass/types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { createRefKey } from "../StatePropertyRef/getStatePropertyRef";
import { raiseError } from "../utils";
import { createStateValueEntry } from "./createStateValueEntry";
import { IStateValueEntry, IStateValueManager } from "./types";

class StateValueManager implements IStateValueManager {
  #listIndexesByListValue: Map<Array<any>, Array<IListIndex>> = new Map();
  #entryByPath = new Map<string, IStateValueEntry>();
  #entryByListIndexByPath = new Map<string, WeakMap<IListIndex, IStateValueEntry>>();
  #pathManager: IStatePathManager;

  constructor(pathManager: IStatePathManager) {
    this.#pathManager = pathManager;
  }
  getEntry(info: IStructuredPathInfo, listIndex: IListIndex | null): IStateValueEntry | null {
    let entry = null;
    if (info.wildcardCount > 0) {
      if (listIndex === null) {
        raiseError(`listIndex must not be null for wildcard path: ${info.pattern}`);
      }
      entry = this.#entryByListIndexByPath.get(info.pattern)?.get(listIndex) ?? null;
    } else {
      entry = this.#entryByPath.get(info.pattern) ?? null;
    }
    return entry;
  }
  getValue(version: number, info: IStructuredPathInfo, listIndex: IListIndex | null): any {
    const entry = this.getEntry(info, listIndex);
    if (entry === null) {
      raiseError(`No value found for version ${version}, path ${info.pattern}, listIndex ${listIndex ? listIndex.toString() : 'null'}`);
    }
    if (entry.version > version) {
      raiseError(`Entry version ${entry.version} is greater than requested version ${version} for path ${info.pattern}`);
    }
    return entry.getValue(version);
  }

  setValue(version: number, info: IStructuredPathInfo, listIndex: IListIndex | null, value: any): void {
    const entry = this.getEntry(info, listIndex);
    if (entry === null) {
      raiseError(`No value found for version ${version}, path ${info.pattern}, listIndex ${listIndex ? listIndex.toString() : 'null'}`);
    }
    if (entry.version > version) {
      raiseError(`Entry version ${entry.version} is greater than requested version ${version} for path ${info.pattern}`);
    }
    entry.setValue(version, value);
  }

  build(version: number, info: IStructuredPathInfo, listIndex: IListIndex | null, value: any): void {
    const entry = this.getEntry(info, listIndex);
    if (entry === null) {
      const newEntry = createStateValueEntry(version, info, listIndex, value);
      if (listIndex !== null) {
        let entryByListIndex = this.#entryByListIndexByPath.get(info.pattern) ?? null;
        if (entryByListIndex === null) {
          entryByListIndex = new WeakMap();
          this.#entryByListIndexByPath.set(info.pattern, entryByListIndex);
        }
        entryByListIndex.set(listIndex, newEntry);
      } else {
        this.#entryByPath.set(info.pattern, newEntry);
      }
    }
    if (this.#pathManager.lists.has(info.pattern)) {
      const listValue = Array.isArray(value) ? value : [];
      // リストインデックスの再構築

    } else {
      const getters = [];
      for(const subPath of this.#pathManager.staticDependencies.get(info.pattern) ?? []) {
        const subInfo = getStructuredPathInfo(subPath);
        this.build(version, subInfo, listIndex, value[subInfo.lastSegment]);
      }
    }
  }
}
