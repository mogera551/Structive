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
import { ILoopContext } from "../LoopContext/types";
import { setLoopContext } from "./methods/setLoopContext";
import { IListIndex2 } from "../ListIndex2/types";
import { IUpdater2 } from "../Updater2/types";

const STACK_DEPTH = 32;

class StateHandler implements IWritableStateHandler {
  engine   : IComponentEngine;
  lastTrackingStack: IStructuredPathInfo | null = null;
  trackingStack: (IStructuredPathInfo | null)[] = Array(STACK_DEPTH).fill(null);
  trackingIndex: number = -1;
  structuredPathInfoStack: (IStructuredPathInfo | null)[] = Array(STACK_DEPTH).fill(null);
  listIndex2Stack: (IListIndex2 | null)[] = Array(STACK_DEPTH).fill(null);
  refIndex: number = -1;
  loopContext: ILoopContext | null = null;
  updater: IUpdater2;
  
  constructor(engine: IComponentEngine, updater: IUpdater2) {
    this.engine = engine;
    this.updater = updater;
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
  updater: IUpdater2,
  state: Object,
  loopContext: ILoopContext | null,
  callback: (stateProxy: IWritableStateProxy) => Promise<void>
): Promise<void> {
  const handler = new StateHandler(engine, updater);
  const stateProxy = new Proxy<IState>(state, handler) as IWritableStateProxy;
  return setLoopContext(handler, loopContext, async () => {
    await callback(stateProxy);
  });
}

