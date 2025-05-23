/**
 * createReadonlyStateProxy.ts
 *
 * StateClassの「読み取り専用」プロキシを生成するための実装ファイルです。
 *
 * 主な役割:
 * - Stateオブジェクトに対して、読み取り専用のProxyを作成
 * - StateHandlerクラスで各種APIやトラップ（get/set）を実装
 * - getトラップでバインディングやAPI呼び出し、依存解決などに対応
 * - setトラップではエラーを投げて書き込みを禁止
 *
 * 設計ポイント:
 * - StateHandlerはIReadonlyStateHandlerを実装し、状態管理やAPI呼び出しの基盤となる
 * - callableApiに各種APIシンボルと関数をマッピングし、柔軟なAPI拡張が可能
 * - createReadonlyStateProxyで一貫した生成・利用が可能
 * - 依存解決やキャッシュ、ループ・プロパティ参照スコープ管理など多機能な設計
 */
import { IStructuredPathInfo } from "../StateProperty/types";
import { IComponentEngine } from "../ComponentEngine/types";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetAllSymbol, GetByRefSymbol, GetContextListIndexSymbol, GetLastStatePropertyRefSymbol, ResolveSymbol, SetByRefSymbol, SetCacheableSymbol, SetLoopContextSymbol, SetStatePropertyRefSymbol } from "./symbols.js";
import { IReadonlyStateHandler, IState, IStateHandler, IStateProxy, IWritableStateHandler } from "./types";
import { getByRef as apiGetByRef } from "./apis/getByRef.js";
import { setCacheable as apiSetCacheable } from "./apis/setCacheable.js";
import { connectedCallback } from "./apis/connectedCallback.js";
import { disconnectedCallback } from "./apis/disconnectedCallback.js";
import { resolve } from "./apis/resolve.js";
import { getAll } from "./apis/getAll.js";
import { get as trapGet } from "./traps/get.js";
import { raiseError } from "../utils";
import { IListIndex } from "../ListIndex/types";
import { ILoopContext } from "../LoopContext/types";
import { setStatePropertyRef } from "./apis/setStatePropertyRef";
import { setLoopContext } from "./apis/setLoopContext";
import { getLastStatePropertyRef } from "./apis/getLastStatePropertyRef";
import { getContextListIndex } from "./apis/getContextListIndex";

class StateHandler implements IReadonlyStateHandler {
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
    [SetCacheableSymbol]: apiSetCacheable, 
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
    raiseError(`Cannot set property ${String(prop)} of readonly state.`);
  }
}

export function createReadonlyStateProxy(
  engine: IComponentEngine, 
  state: Object
): IStateProxy {
  return new Proxy<IState>(state, new StateHandler(engine)) as IStateProxy;
}

