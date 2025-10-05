/**
 * createReadonlyStateProxy.ts
 *
 * StateClass の「読み取り専用」プロキシを生成します。
 *
 * 主な役割:
 * - State オブジェクトに対する読み取り専用の Proxy を作成
 * - get トラップでバインディング/API呼び出し/依存解決/レンダラー連携に対応
 * - set トラップは常に例外を投げて書き込みを禁止
 * - has トラップで内部APIシンボル（GetByRefSymbol, SetCacheableSymbol 等）を公開
 *
 * Throws:
 * - STATE-202 Cannot set property ... of readonly state（set トラップ）
 */
import { IStructuredPathInfo } from "../StateProperty/types";
import { IComponentEngine } from "../ComponentEngine/types";
import { IReadonlyStateHandler, IState, IReadonlyStateProxy, IComponentEngineForStateClass, IStateProxy } from "./types";
import { getReadonly as trapGet } from "./traps/getReadonly.js";
import { raiseError } from "../utils";
import { ILoopContext } from "../LoopContext/types";
import { IPropertyAccessor, IRenderer, IUpdateContext } from "../Updater/types";
import { IStatePropertyRef } from "../StatePropertyRef/types";
import { GetByRefSymbol } from "./symbols";
import { createPropertyAccessor } from "../Updater/PropertyAccessor";

const STACK_DEPTH = 32;

class StateHandler implements IReadonlyStateHandler {
  engine: IComponentEngineForStateClass;
  #accessor: IPropertyAccessor | undefined = undefined;
  refStack: (IStatePropertyRef | null)[] = Array(STACK_DEPTH).fill(null);
  refIndex: number = -1;
  lastRefStack: IStatePropertyRef | null = null;
  #setMethods = new Set<PropertyKey>([ GetByRefSymbol ]);
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
    receiver: IReadonlyStateProxy
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
    receiver: IReadonlyStateProxy
  ): boolean {
    raiseError({
      code: 'STATE-202',
      message: `Cannot set property ${String(prop)} of readonly state`,
      context: { where: 'createReadonlyStateProxy.set', prop: String(prop) },
      docsUrl: './docs/error-codes.md#state',
    });
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

export function createReadonlyStateProxy(
  engine: IComponentEngineForStateClass, 
  context: IUpdateContext,
  state: Object,
): IReadonlyStateProxy {
  const handler = new StateHandler(engine);
  const stateProxy = new Proxy<IState>(state, handler) as IReadonlyStateProxy;
  handler.setAccessor(context, stateProxy);
  return stateProxy;
}
