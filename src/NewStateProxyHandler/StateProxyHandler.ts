import { IListIndex } from "../ListIndex/types";
import { IStatePathManager } from "../NewStatePathManager/types";
import { IStateValueManager } from "../NewStateValues.ts/types";
import { getResolvedPathInfo } from "../StateProperty/getResolvedPathInfo";
import { IStructuredPathInfo } from "../StateProperty/types";
import { raiseError } from "../utils";
import { IState, IStateExtended } from "./types";

const STACK_MAX = 16;
const FILL_STACK_UNDEFINED: (number | undefined)[] = new Array(STACK_MAX).fill(undefined);

class StateProxyHandler implements ProxyHandler<IState> {
  #version: number;
  #pathManager: IStatePathManager;
  #stateValueManager: IStateValueManager;
  #indexes: (number | undefined)[] = new Array(STACK_MAX).fill(undefined);
  #validIndexSize: number = 0;
  // ['$1': 0, '$2': 1, '$3': 2, ...]
  #indexByIndexName: Record<string, number> = {};

  constructor(
    version: number, 
    pathManager: IStatePathManager,
    stateValueManager: IStateValueManager
  ) {
    this.#version = version;
    this.#pathManager = pathManager;
    this.#stateValueManager = stateValueManager;

    // Initialize indexByIndexName with $1 to $16
    this.#indexByIndexName = {};
    for (let i = 0; i < STACK_MAX; i++) {
      this.#indexByIndexName[`$${i+1}`] = i;
    }
  }

  stacks: { 
    pattern: string,
    info: IStructuredPathInfo,
    listIndex: IListIndex | null,
   }[] = [];
  stack(info: IStructuredPathInfo, callback: () => any): any {
    let listIndex = null;
    const lastStack = this.stacks[this.stacks.length - 1];
    if (lastStack) {
      listIndex = lastStack.listIndex;
      if (listIndex !== null) {
        const matchInfo = Array.from(lastStack.info.wildcardInfoSet.intersection(info.wildcardInfoSet)).at(-1) || null;
        if (matchInfo) {
          if (listIndex.length > matchInfo.wildcardCount) {
            // aaa.*.bbb.*.cccとaaa.*.BBB.*.CCCのように、パターンが部分一致の場合
            listIndex = listIndex.at(matchInfo.wildcardCount - 1) || null;
            this.#validIndexSize = listIndex?.length ?? 0;
          }
        } else {
          // aaa.*.bbb.*.cccとAAA.*.BBB.*.CCCのように、パターンが一致しない場合
          listIndex = null;
        }
      }
      // 動的依存の登録
      if (lastStack.info.pattern !== info.pattern) {
        this.#pathManager.addDynamicDependency(lastStack.pattern, info.pattern);
      }
    }
    this.stacks.push({ pattern: info.pattern, info, listIndex });
    try {
      return callback();
    } finally {
      this.stacks.pop();
      this.#validIndexSize = lastStack?.listIndex?.length ?? 0;
    }
  }

  setRef(info: IStructuredPathInfo, listIndex: IListIndex | null, callback: () => any): any {
    this.#validIndexSize = listIndex?.length ?? 0;
    if (listIndex !== null) {
      for(let i = 0; i < listIndex.length; i++) {
        this.#indexes[i] = listIndex.indexes[i];
      }
    }
    this.stacks.push({ pattern: info.pattern, info, listIndex });
    try {
      return callback();
    } finally {
      this.stacks.pop();
      this.#validIndexSize = this.stacks.at(-1)?.listIndex?.length ?? 0;
    }
  }

  get(target: IState, prop: PropertyKey, receiver: IStateExtended): any {
    if (typeof prop === "string") {
      const index = this.#indexByIndexName[prop];
      if (typeof index === "number") {
        if (index >= this.#validIndexSize) {
          raiseError(`Index '${String(prop)}' is out of bounds. Valid range is 0 to ${this.#validIndexSize - 1}.`);
        }
        return this.#indexes[index];
      }

      const resolvedPathInfo = getResolvedPathInfo(prop);
      if (resolvedPathInfo.wildcardType !== "all") {
        return this.stack(resolvedPathInfo.info, () => {
          return Reflect.get(target, prop, receiver);
        });
      } else if (resolvedPathInfo.wildcardType === "all") {
        // aaa.1.bbb.13.cccのように、ワイルドカードが含まれるパスの場合
      } else {
        raiseError(`Unsupported wildcard type for path: ${resolvedPathInfo.name}`);
      }
    } else {
      return Reflect.get(target, prop, receiver);
    }
  }

  set(target: IState, prop: PropertyKey, value: any, receiver: IStateExtended): boolean {
    if (typeof prop === "string") {
      try {
        const resolvedPathInfo = getResolvedPathInfo(prop);
        if (resolvedPathInfo.wildcardType !== "all") {
          return this.stack(resolvedPathInfo.info, () => {
            return Reflect.set(target, prop, receiver);
          });
        } else if (resolvedPathInfo.wildcardType === "all") {
          // aaa.1.bbb.13.cccのように、ワイルドカードが含まれるパスの場合
        } else {
          raiseError(`Unsupported wildcard type for path: ${resolvedPathInfo.name}`);
        }

      } finally {
        return true;
      }
    } else {
      return Reflect.set(target, prop, value, receiver);
    }
  }
}

