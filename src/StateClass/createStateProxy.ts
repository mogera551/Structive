import { IStructuredPathInfo } from "../StateProperty/types";
import { IComponentEngine } from "../ComponentEngine/types";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetAllSymbol, GetByRefSymbol, ResolveSymbol, SetByRefSymbol, SetCacheableSymbol } from "./symbols";
import { IState, IStateHandler, IStateProxy } from "./types";
import { getByRef as apiGetByRef } from "./apis/getByRef";
import { setByRef as apiSetByRef } from "./apis/setByRef";
import { setCacheable as apiSetCacheable } from "./apis/setCacheable";
import { connectedCallback } from "./apis/connectedCallback";
import { disconnectedCallback } from "./apis/disconnectedCallback";
import { resolve } from "./apis/resolve";
import { getAll } from "./apis/getAll";
import { get as trapGet } from "./traps/get";
import { set as trapSet } from "./traps/set";

class StateHandler implements IStateHandler {
  engine   : IComponentEngine;
  cacheable: boolean = false;
  cache    : {[key:number]:any} = {};
  lastTrackingStack: IStructuredPathInfo | null = null;
  trackingStack: IStructuredPathInfo[] = [];
  
  constructor(engine: IComponentEngine) {
    this.engine = engine;
  }

  callableApi: { [key:symbol]: Function } = {
    [GetByRefSymbol]: apiGetByRef, 
    [SetByRefSymbol]: apiSetByRef, 
    [SetCacheableSymbol]: apiSetCacheable, 
    [ConnectedCallbackSymbol]: connectedCallback, 
    [DisconnectedCallbackSymbol]: disconnectedCallback, 
    [ResolveSymbol]: resolve, 
    [GetAllSymbol]: getAll,
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

export function createStateProxy(
  engine: IComponentEngine, 
  state: Object
): IStateProxy {
  return new Proxy<IState>(state, new StateHandler(engine)) as IStateProxy;
}

