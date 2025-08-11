import { IState } from "../NewStateProxyHandler/types";
import { IStateValueManager } from "./types";

class StateProxyHandlerForRebuild implements ProxyHandler<IState> {
  #stateValueManager: IStateValueManager;
  constructor(stateValueManager: IStateValueManager) {
    this.#stateValueManager = stateValueManager;
  }

  get(target: IState, prop: PropertyKey, receiver: Object): any {
  }

}
