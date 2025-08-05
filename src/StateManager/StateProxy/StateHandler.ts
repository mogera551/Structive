import { IState } from "../../StateClass/types";
import { getStructuredPathInfo } from "../../StateProperty/getStructuredPathInfo";
import { IStateManager } from "../types";

class StateHandler {
  manager: IStateManager;
  constructor(manager: IStateManager) {
    this.manager = manager;
  }

  /**
   * 
   * @param target 
   * @param prop 
   * @param receiver
   * @returns {any}
   * 
   * getトラップの実装、状態クラス内でthis[prop]のようにプロパティアクセスを行う際に呼び出される。 
   */
  get(target: IState, prop: PropertyKey, receiver: ProxyHandler<IState>): any {
    // propを解決する
    if (typeof prop === "string") {
      const pathInfo = getStructuredPathInfo(prop);
      if (this.manager.pathManager.all.has(pathInfo)) {
        return Reflect.get(target, prop, receiver);
      }
    }
  }

  /**
   * 
   * @param target
   * @param prop
   * @param value
   * @param receiver
   * @returns {boolean}
   *
   * setトラップの実装、状態クラス内でthis[prop]に値を設定する際に呼び出される。
   * 値の更新をトリガーするための処理を行う。
   * 
   * 注意: このメソッドは状態の更新をトリガーするため、値の設定後に必要な処理を行う。
   * 例えば、状態の変更を通知したり、依存関係を更新したりする。
   */
  set(target: IState, prop: PropertyKey, value: any, receiver: ProxyHandler<IState>): boolean {
    try {

    } finally {
      // ここで状態の更新をトリガーする
    }
    return true;
  }
}
