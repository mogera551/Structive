import { IStructuredPathInfo } from "../StateProperty/types";
import { IComponentEngine } from "../ComponentEngine/types";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetAllSymbol, GetByRefSymbol, GetContextListIndexSymbol, GetLastStatePropertyRefSymbol, ResolveSymbol, SetByRefSymbol, SetLoopContextSymbol, SetStatePropertyRefSymbol } from "./symbols.js";
import { IState, IStateHandler, IStateProxy, IWritableStateHandler } from "./types";
import { getByRef as apiGetByRef } from "./apis/getByRef.js";
import { setByRef as apiSetByRef } from "./apis/setByRef.js";
import { setCacheable as apiSetCacheable } from "./apis/setCacheable.js";
import { connectedCallback } from "./apis/connectedCallback.js";
import { disconnectedCallback } from "./apis/disconnectedCallback.js";
import { resolve } from "./apis/resolve.js";
import { getAll } from "./apis/getAll.js";
import { get as trapGet } from "./traps/get.js";
import { set as trapSet } from "./traps/set.js";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { IListIndex } from "../ListIndex/types";
import { ILoopContext } from "../LoopContext/types";
import { setStatePropertyRef } from "./apis/setStatePropertyRef";
import { setLoopContext } from "./apis/setLoopContext";
import { getLastStatePropertyRef } from "./apis/getLastStatePropertyRef";
import { getContextListIndex } from "./apis/getContextListIndex";

class StateHandler implements IWritableStateHandler {
  engine   : IComponentEngine;
  cacheable: boolean = false;
  cache    : {[key:number]:any} = {};
  lastTrackingStack: IStructuredPathInfo | null = null;
  trackingStack: IStructuredPathInfo[] = [];
  structuredPathInfoStack: IStructuredPathInfo[] = [];
  listIndexStack: (IListIndex | null)[] = [];
  loopContext: ILoopContext | null = null;
  
  constructor(engine: IComponentEngine) {
    this.engine = engine;
  }

  callableApi: { [key:symbol]: Function } = {
    [GetByRefSymbol]: apiGetByRef, 
    [SetByRefSymbol]: apiSetByRef, 
    [ConnectedCallbackSymbol]: connectedCallback, 
    [DisconnectedCallbackSymbol]: disconnectedCallback, 
    [ResolveSymbol]: resolve, 
    [GetAllSymbol]: getAll,
    [SetStatePropertyRefSymbol]: setStatePropertyRef,
    [SetLoopContextSymbol]: setLoopContext,
    [GetLastStatePropertyRefSymbol]: getLastStatePropertyRef,
   [GetContextListIndexSymbol]: getContextListIndex
   };

  get(
    target  : Object, 
    prop    : PropertyKey, 
    receiver: IStateProxy
  ): any {
    return trapGet(target, prop, receiver, this);
  }

  set(
    target  : Object, 
    prop    : PropertyKey, 
    value   : any, 
    receiver: IStateProxy
  ): boolean {
    return trapSet(target, prop, value, receiver, this);
  }
}

export function createWritableStateProxy(
  engine: IComponentEngine, 
  state: Object
): IStateProxy {
  return new Proxy<IState>(state, new StateHandler(engine)) as IStateProxy;
}

