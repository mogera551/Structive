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
import { IReadonlyStateHandler, IState, IReadonlyStateProxy } from "./types";
import { getReadonly as trapGet } from "./traps/getReadonly.js";
import { raiseError } from "../utils";
import { ILoopContext } from "../LoopContext/types";
import { IListIndex2 } from "../ListIndex2/types";
import { IRenderer } from "../Updater2/types";
import { useWritableStateProxy } from "./useWritableStateProxy";

const STACK_DEPTH = 32;

class StateHandler implements IReadonlyStateHandler {
  engine   : IComponentEngine;
  cacheable: boolean = false;
  cache    : {[key: string]: any} = {};
  lastTrackingStack: IStructuredPathInfo | null = null;
  trackingStack: (IStructuredPathInfo | null)[] = Array(STACK_DEPTH).fill(null);
  trackingIndex: number = -1;
  structuredPathInfoStack: (IStructuredPathInfo | null)[] = Array(STACK_DEPTH).fill(null);
  listIndex2Stack: (IListIndex2 | null)[] = Array(STACK_DEPTH).fill(null);
  refIndex: number = -1;
  loopContext: ILoopContext | null = null;
  renderer: IRenderer;

  constructor(engine: IComponentEngine, renderer: IRenderer) {
    this.engine = engine;
    this.renderer = renderer;
  }

  get(
    target  : Object, 
    prop    : PropertyKey, 
    receiver: IReadonlyStateProxy
  ): any {
    return trapGet(target, prop, receiver, this);
  }

  set(
    target  : Object, 
    prop    : PropertyKey, 
    value   : any, 
    receiver: IReadonlyStateProxy
  ): boolean {
    raiseError(`Cannot set property ${String(prop)} of readonly state.`);
  }
}

export function createReadonlyStateProxy(
  engine: IComponentEngine, 
  renderer: IRenderer,
  state: Object
): IReadonlyStateProxy {
  return new Proxy<IState>(state, new StateHandler(engine, renderer)) as IReadonlyStateProxy;
}
