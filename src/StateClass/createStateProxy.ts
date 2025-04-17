import { IListIndex } from "../ListIndex/types";
import { getResolvedPathInfo } from "../StateProperty/getResolvedPathInfo";
import { IResolvedPathInfo, IStructuredPathInfo } from "../StateProperty/types";
import { getStatePropertyRefId } from "../StatePropertyRef/getStatePropertyRefId";
import { IComponentEngine } from "../ComponentEngine/types";
import { raiseError } from "../utils";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetAllSymbol, GetByRefSymbol, ResolveSymbol, SetByRefSymbol, SetCacheableSymbol } from "./symbols";
import { IState, IStateProxy } from "./types";
import { getStructuredPathInfo } from "../StateProperty/getStructuredPathInfo";

const matchIndexPropertyName = new RegExp(/^\$(\d+)$/);
const CONNECTED_CALLBACK = "$connectedCallback";
const DISCONNECTED_CALLBACK = "$disconnectedCallback";

function getListIndex(
  info: IResolvedPathInfo, 
  engine: IComponentEngine
): IListIndex | null {
  if (info.info.wildcardCount === 0) {
    return null;
  }
  let listIndex: IListIndex | null = null;
  const lastWildcardPath = info.info.lastWildcardPath ?? 
    raiseError(`lastWildcardPath is null`);
  if (info.wildcardType === "context") {
    listIndex = engine.getContextListIndex(lastWildcardPath) ?? 
      raiseError(`ListIndex not found: ${info.info.pattern}`);
  } else if (info.wildcardType === "all") {
    let parentListIndex = null;
    for(let i = 0; i < info.info.wildcardCount; i++) {
      const wildcardParentPattern = info.info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPattern is null`);
      const listIndexes: IListIndex[] = Array.from(engine.getListIndexesSet(wildcardParentPattern, parentListIndex) ?? []);
      const wildcardIndex = info.wildcardIndexes[i] ?? raiseError(`wildcardIndex is null`);
      parentListIndex = listIndexes[wildcardIndex] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
    }
    listIndex = parentListIndex;
  } else if (info.wildcardType === "partial") {
    // ToDo:listIndexを取得する必要がある
  } else if (info.wildcardType === "none") {
  }
  return listIndex;
}

class StateHandler {
  engine   : IComponentEngine;
  cacheable: boolean = false;
  cache    : {[key:number]:any} = {};
  constructor(engine: IComponentEngine) {
    this.engine = engine;
  }

  _getByRef(
    target   : Object, 
    info     : IStructuredPathInfo,
    listIndex: IListIndex | null,
    receiver : IStateProxy
  ): any {
    if (this.#lastTrackingStack != null && this.#lastTrackingStack !== info) {
      const lastPattern = this.#lastTrackingStack;
      if (lastPattern.parentInfo !== info) {
        this.engine.addDependentProp(lastPattern, info);
      }
    }

    let refId = 0;
    if (this.cacheable) {
      refId = getStatePropertyRefId(info, listIndex);
      const value = this.cache[refId];
      if (typeof value !== "undefined") {
        return value;
      }
      if (refId in this.cache) {
        return undefined;
      }
    }

    let value;
    try {
      if (info.pattern in target) {
        if (info.wildcardCount > 0) {
          if (listIndex === null) {
            raiseError(`propRef.listIndex is null`);
          }
          return (value = this.engine.setStatePropertyRef(info, listIndex, () => {
            return Reflect.get(target, info.pattern, receiver);
          }));
        } else {
          return (value = Reflect.get(target, info.pattern, receiver));
        }
      } else {
        const parentInfo = info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
        const parentListIndex = parentInfo.wildcardCount < info.wildcardCount ? (listIndex?.parentListIndex ?? null) : listIndex;
        const parentValue = this.getByRef(target, parentInfo, parentListIndex, receiver);
        const lastSegment = info.lastSegment;
        if (lastSegment === "*") {
          const index = listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
          return (value = Reflect.get(parentValue, index));
        } else {
          return (value = Reflect.get(parentValue, lastSegment));
        }
      }
    } finally {
      if (this.cacheable && !(refId in this.cache)) {
        this.cache[refId] = value;
      }
    }
  }

  #trackingStack: IStructuredPathInfo[] = [];
  #lastTrackingStack: IStructuredPathInfo | null = null;
  setTracking(info: IStructuredPathInfo, callback: () => any): any {
    this.#trackingStack.push(info);
    this.#lastTrackingStack = info;
    try {
      return callback();
    } finally {
      this.#trackingStack.pop();
      this.#lastTrackingStack = this.#trackingStack[this.#trackingStack.length - 1] ?? null;
    }
  }

  getByRef(
    target   : Object, 
    info     : IStructuredPathInfo,
    listIndex: IListIndex | null,
    receiver : IStateProxy
  ): any {
    if (this.engine.trackedGetters.has(info.pattern)) {
      return this.setTracking(info, () => {
        return this._getByRef(target, info, listIndex, receiver);
      });
    } else {
      return this._getByRef(target, info, listIndex, receiver);
    }

  }

  setByRef(
    target   : Object, 
    info     : IStructuredPathInfo, 
    listIndex: IListIndex | null, 
    value    : any, 
    receiver : IStateProxy
  ): any {
    try {
      if (info.pattern in target) {
        if (info.wildcardCount > 0) {
          if (listIndex === null) {
            raiseError(`propRef.listIndex is null`);
          }
          return this.engine.setStatePropertyRef(info, listIndex, () => {
            return Reflect.set(target, info.pattern, value, receiver);
          });
        } else {
          return Reflect.set(target, info.pattern, value, receiver);
        }
      } else {
        const parentInfo = info.parentInfo ?? raiseError(`propRef.stateProp.parentInfo is undefined`);
        const parentListIndex = parentInfo.wildcardCount < info.wildcardCount ? (listIndex?.parentListIndex ?? null) : listIndex;
        const parentValue = this.getByRef(target, parentInfo, parentListIndex, receiver);
        const lastSegment = info.lastSegment;
        if (lastSegment === "*") {
          const index = listIndex?.index ?? raiseError(`propRef.listIndex?.index is undefined`);
          return Reflect.set(parentValue, index, value);
        } else {
          return Reflect.set(parentValue, lastSegment, value);
        }
      }
    } finally {
      this.engine.updater.addUpdatedStatePropertyRefValue(info, listIndex, value);
    }
  }

  async setCacheable(callback: () => Promise<void>): Promise<void> {
    this.cacheable = true;
    this.cache = {}
    try {
      await callback();
    } finally {
      this.cacheable = false;
    }
  }

  [GetByRefSymbol](
    target: Object, 
    prop: PropertyKey, 
    receiver: IStateProxy
  ):Function {
    const self = this;
    return (pattern: IStructuredPathInfo, listIndex: IListIndex) => 
      self.getByRef(target, pattern, listIndex, receiver);
  } 

  [SetByRefSymbol](target: Object, prop: PropertyKey, receiver: IStateProxy):Function {
    const self = this;
    return (pattern: IStructuredPathInfo, listIndex: IListIndex, value: any) => 
      self.setByRef(target, pattern, listIndex, value, receiver);

  }
  [SetCacheableSymbol](target: Object, prop: PropertyKey, receiver: IStateProxy):Function {
    const self = this;
    return async (callback: () => Promise<void>) => {
      await self.setCacheable(callback);
    }
  }
  [ConnectedCallbackSymbol](target: Object, prop: PropertyKey, receiver: IStateProxy):Function {
    return async () => {
      const callback = Reflect.get(target, CONNECTED_CALLBACK);
      if (typeof callback === "function") {
        await callback.call(target, receiver);
      }
    };
  }
  [DisconnectedCallbackSymbol](target: Object, prop: PropertyKey, receiver: IStateProxy):Function {
    return async () => {
      const callback = Reflect.get(target, DISCONNECTED_CALLBACK);
      if (typeof callback === "function") {
        await callback.call(target, receiver);
      }
    };
  }
  [ResolveSymbol](target: Object, prop: PropertyKey, receiver: IStateProxy):Function {
    const self = this;
    return (path: string, indexes: number[], value?:any): any => {
      const info = getStructuredPathInfo(path);
      let listIndex: IListIndex | null = null;
      for(let i = 0; i < info.wildcardParentInfos.length; i++) {
        const wildcardParentPattern = info.wildcardParentInfos[i] ?? raiseError(`wildcardParentPath is null`);
        const listIndexes: IListIndex[] = Array.from(self.engine.getListIndexesSet(wildcardParentPattern, listIndex) ?? []);
        const index = indexes[i] ?? raiseError(`index is null`);
        listIndex = listIndexes[index] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
      }
      if (typeof value === "undefined") {
        return self.getByRef(target, info, listIndex, receiver);
      } else {
        return self.setByRef(target, info, listIndex, value, receiver);
      }
    };
  } 
  [GetAllSymbol](target: Object, prop: PropertyKey, receiver: IStateProxy):Function {
    const self = this;
    const resolve = this[ResolveSymbol](target, prop, receiver);
    return (path: string, indexes?: number[]): any[] => {
      const info = getStructuredPathInfo(path);
      if (this.#lastTrackingStack != null && this.#lastTrackingStack !== info) {
        const lastPattern = this.#lastTrackingStack;
        if (lastPattern.parentInfo !== info) {
          this.engine.addDependentProp(lastPattern, info);
        }
      }
  
      if (typeof indexes === "undefined") {
        for(let i = 0; i < info.wildcardInfos.length; i++) {
          const wildcardPattern = info.wildcardInfos[i] ?? raiseError(`wildcardPattern is null`);
          const listIndex = this.engine.getContextListIndex(wildcardPattern.pattern);
          if (listIndex) {
            indexes = listIndex.indexes;
            break;
          }
        }
        if (typeof indexes === "undefined") {
          indexes = [];
        }
      }
      const walkWildcardPattern = (
        wildcardParentInfos: IStructuredPathInfo[],
        wildardIndexPos: number,
        listIndex: IListIndex | null,
        indexes: number[],
        indexPos: number,
        parentIndexes: number[],
        results: number[][]
      ) => {
        const wildcardParentPattern = wildcardParentInfos[wildardIndexPos] ?? null;
        if (wildcardParentPattern === null) {
          results.push(parentIndexes);
          return;
        }
        const listIndexSet = self.engine.getListIndexesSet(wildcardParentPattern, listIndex) ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
        const listIndexes = Array.from(listIndexSet);
        const index = indexes[indexPos] ?? null;
        if (index === null) {
          for(let i = 0; i < listIndexes.length; i++) {
            const listIndex = listIndexes[i];
            walkWildcardPattern(
              wildcardParentInfos, 
              wildardIndexPos + 1, 
              listIndex, 
              indexes, 
              indexPos + 1, 
              parentIndexes.concat(listIndex.index),
              results);
          }
        } else {
          const listIndex = listIndexes[index] ?? raiseError(`ListIndex not found: ${wildcardParentPattern.pattern}`);
          if ((wildardIndexPos + 1) < wildcardParentInfos.length) {
            walkWildcardPattern(
              wildcardParentInfos, 
              wildardIndexPos + 1, 
              listIndex, 
              indexes, 
              indexPos + 1, 
              parentIndexes.concat(listIndex.index),
              results
            );
          }
        }
      }
      const resultIndexes: number[][] = [];
      walkWildcardPattern(
        info.wildcardParentInfos, 
        0, 
        null, 
        indexes, 
        0, 
        [], 
        resultIndexes
      );
      const resultValues: any[] = [];
      for(let i = 0; i < resultIndexes.length; i++) {
        resultValues.push(resolve(
          info.pattern,
          resultIndexes[i]
        ));
      }
      return resultValues;
    }
  }

  callableSymbols = new Set([
    GetByRefSymbol, 
    SetByRefSymbol, 
    SetCacheableSymbol, 
    ConnectedCallbackSymbol, 
    DisconnectedCallbackSymbol, 
    ResolveSymbol, 
    GetAllSymbol
  ]);

  get(
    target  : Object, 
    prop    : PropertyKey, 
    receiver: IStateProxy
  ): any {
    let value;
    if (typeof prop === "string") {
      if (matchIndexPropertyName.test(prop)) {
        const number = prop.slice(1);
        const index = Number(number);
        const ref = this.engine.getLastStatePropertyRef() ?? 
          raiseError(`get: this.engine.getLastStatePropertyRef() is null`);
        return ref.listIndex?.at(index - 1)?.index ?? raiseError(`ListIndex not found: ${prop}`);
      } else if (prop === "$resolve") {
        return this[ResolveSymbol].apply(this, [target, prop, receiver]);
      } else if (prop === "$getAll") {
        return this[GetAllSymbol].apply(this, [target, prop, receiver]);
      } else {
        const resolvedInfo = getResolvedPathInfo(prop);
        const listIndex = getListIndex(resolvedInfo, this.engine);
        value = this.getByRef(
          target, 
          resolvedInfo.info, 
          listIndex, 
          receiver
        );
      }
    } else if (typeof prop === "symbol") {
      if (this.callableSymbols.has(prop)) {
        const func = Reflect.get(this, prop) as Function;
        return func.apply(this, [target, prop, receiver]);
      }
      value = Reflect.get(
        target, 
        prop, 
        receiver
      );
    }
    return value;
  }

  set(
    target  : Object, 
    prop    : PropertyKey, 
    value   : any, 
    receiver: IStateProxy
  ): boolean {
    if (typeof prop === "string") {
      const resolvedInfo = getResolvedPathInfo(prop);
      const listIndex = getListIndex(resolvedInfo, this.engine);
      return this.setByRef(
        target, 
        resolvedInfo.info, 
        listIndex, 
        value, 
        receiver
      );
    } else {
      return Reflect.set(
        target, 
        prop, 
        value, 
        receiver
      );
    }
  }

}

export function createStateProxy(
  engine: IComponentEngine, 
  state: Object
): IStateProxy {
  return new Proxy<IState>(state, new StateHandler(engine)) as IStateProxy;
}

