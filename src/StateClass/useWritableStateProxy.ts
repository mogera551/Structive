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
import { IComponentEngineForStateClass, IState, IStateProxy, IWritableStateHandler, IWritableStateProxy } from "./types";
import { getWritable as trapGet } from "./traps/getWritable.js";
import { set as trapSet } from "./traps/set.js";
import { ILoopContext } from "../LoopContext/types";
import { setLoopContext } from "./methods/setLoopContext";
import { IPropertyAccessor, IUpdateContext, IUpdater } from "../Updater/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetByRefSymbol, SetByRefSymbol } from "./symbols";
import { createPropertyAccessor } from "../Updater/PropertyAccessor";
import { raiseError } from "../utils";

const STACK_DEPTH = 32;

class StateHandler implements IWritableStateHandler {
  engine: IComponentEngineForStateClass;
  #accessor: IPropertyAccessor | undefined = undefined;
  refStack: (IStatePropertyRef | null)[] = Array(STACK_DEPTH).fill(null);
  refIndex: number = -1;
  lastRefStack: IStatePropertyRef | null = null;
  loopContext: ILoopContext | null = null;
  #setMethods = new Set<PropertyKey>([ GetByRefSymbol, SetByRefSymbol, ConnectedCallbackSymbol, DisconnectedCallbackSymbol ]);
  #setApis = new Set<PropertyKey>([ "$resolve", "$getAll", "$trackDependency", "$navigate", "$component" ]);

  constructor(engine: IComponentEngineForStateClass) {
    this.engine = engine;
  }

  setAccessor(context: IUpdateContext, proxy:IStateProxy): IPropertyAccessor {
    this.#accessor = createPropertyAccessor(proxy, context);
    return this.#accessor;
  }

  get accessor(): IPropertyAccessor {
    if (!this.#accessor) {
      raiseError({
        code: 'STATE-201',
        message: 'accessor is not set',
        context: { where: 'StateHandler.accessor' },
        docsUrl: '/docs/error-codes.md#state',
        severity: 'error',
      });
    }
    return this.#accessor;
  }

  /**
   * getトラップ
   * @param target 対象オブジェクト
   * @param prop プロパティ名
   * @param receiver プロキシ自身
   * @returns プロパティの値
   */
  get(
    target  : Object, 
    prop    : PropertyKey, 
    receiver: IWritableStateProxy
  ): any {
    return trapGet(target, prop, receiver, this);
  }

  /**
   * setトラップ
   * @param target 対象オブジェクト
   * @param prop プロパティ名
   * @param value 新しい値
   * @param receiver プロキシ自身
   * @returns 成功した場合はtrue
   */
  set(
    target  : Object, 
    prop    : PropertyKey, 
    value   : any, 
    receiver: IWritableStateProxy
  ): boolean {
    return trapSet(target, prop, value, receiver, this);
  }

  /**
   * hasトラップ
   * @param target 対象オブジェクト
   * @param prop プロパティ名
   * @returns プロパティが存在する場合はtrue
   */
  has(
    target: Object, 
    prop  : PropertyKey
  ): boolean {
    return Reflect.has(target, prop) || this.#setMethods.has(prop) || this.#setApis.has(prop);
  }
}

export async function useWritableStateProxy(
  engine: IComponentEngineForStateClass, 
  context: IUpdateContext,
  state: Object,
  loopContext: ILoopContext | null,
  callback: (stateProxy: IWritableStateProxy) => Promise<void>
): Promise<void> {
  const handler = new StateHandler(engine);
  const stateProxy = new Proxy<IState>(state, handler) as IWritableStateProxy;
  handler.setAccessor(context, stateProxy);
  return setLoopContext(handler, loopContext, async () => {
    await callback(stateProxy);
  });
}

