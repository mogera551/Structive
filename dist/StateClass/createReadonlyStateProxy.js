import { getReadonly as trapGet } from "./traps/getReadonly.js";
import { raiseError } from "../utils";
import { GetByRefSymbol } from "./symbols";
import { createPropertyAccessor } from "../Updater/PropertyAccessor";
const STACK_DEPTH = 32;
class StateHandler {
    engine;
    #accessor = undefined;
    refStack = Array(STACK_DEPTH).fill(null);
    refIndex = -1;
    lastRefStack = null;
    #setMethods = new Set([GetByRefSymbol]);
    #setApis = new Set(["$resolve", "$getAll", "$trackDependency", "$navigate", "$component"]);
    constructor(engine) {
        this.engine = engine;
    }
    setAccessor(context, proxy) {
        this.#accessor = createPropertyAccessor(proxy, context);
        return this.#accessor;
    }
    get accessor() {
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
    get(target, prop, receiver) {
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
    set(target, prop, value, receiver) {
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
    has(target, prop) {
        return Reflect.has(target, prop) || this.#setMethods.has(prop) || this.#setApis.has(prop);
    }
}
export function createReadonlyStateProxy(engine, context, state) {
    const handler = new StateHandler(engine);
    const stateProxy = new Proxy(state, handler);
    handler.setAccessor(context, stateProxy);
    return stateProxy;
}
