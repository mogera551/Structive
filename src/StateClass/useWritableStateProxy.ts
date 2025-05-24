/**
 * createWritableStateProxy.ts
 *
 * StateClassの「書き込み可能」プロキシを生成するための実装ファイルです。
 *
 * 主な役割:
 * - Stateオブジェクトに対して、書き込み可能なProxyを作成
 * - StateHandlerクラスで各種APIやトラップ（get/set）を実装
 * - getトラップでバインディングやAPI呼び出し、依存解決などに対応
 * - setトラップで値の書き込みや副作用（依存解決・再描画）を一元管理
 *
 * 設計ポイント:
 * - StateHandlerはIWritableStateHandlerを実装し、状態管理やAPI呼び出しの基盤となる
 * - callableApiに各種APIシンボルと関数をマッピングし、柔軟なAPI拡張が可能
 * - createWritableStateProxyで一貫した生成・利用が可能
 * - 依存解決やキャッシュ、ループ・プロパティ参照スコープ管理など多機能な設計
 */
import { IStructuredPathInfo } from "../StateProperty/types";
import { IComponentEngine } from "../ComponentEngine/types";
import { IState, IWritableStateHandler, IWritableStateProxy } from "./types";
import { getWritable as trapGet } from "./traps/getWritable.js";
import { set as trapSet } from "./traps/set.js";
import { IListIndex } from "../ListIndex/types";
import { ILoopContext } from "../LoopContext/types";
import { setLoopContext } from "./methods/setLoopContext";

class StateHandler implements IWritableStateHandler {
  engine   : IComponentEngine;
  lastTrackingStack: IStructuredPathInfo | null = null;
  trackingStack: (IStructuredPathInfo | null)[] = Array(16).fill(null);
  trackingIndex: number = -1;
  structuredPathInfoStack: IStructuredPathInfo[] = [];
  listIndexStack: (IListIndex | null)[] = [];
  loopContext: ILoopContext | null = null;
  
  constructor(engine: IComponentEngine) {
    this.engine = engine;
  }

  get(
    target  : Object, 
    prop    : PropertyKey, 
    receiver: IWritableStateProxy
  ): any {
    return trapGet(target, prop, receiver, this);
  }

  set(
    target  : Object, 
    prop    : PropertyKey, 
    value   : any, 
    receiver: IWritableStateProxy
  ): boolean {
    return trapSet(target, prop, value, receiver, this);
  }
}

export async function useWritableStateProxy(
  engine: IComponentEngine, 
  state: Object,
  loopContext: ILoopContext | null = null,
  callback: (stateProxy: IWritableStateProxy) => Promise<void>
): Promise<void> {
  const handler = new StateHandler(engine);
  const stateProxy = new Proxy<IState>(state, handler) as IWritableStateProxy;
  return setLoopContext(handler, loopContext, async () => {
    await callback(stateProxy);
  });
}

