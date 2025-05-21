import { IBinding } from "../DataBinding/types";
import { IStateProxy } from "../StateClass/types";
import { IUpdater } from "./types";
import { raiseError } from "../utils";
import { render } from "./render";
import { rebuild } from "./rebuild";
import { SetCacheableSymbol } from "../StateClass/symbols";

const updaters = new Set<IUpdater>();;

export function registerRender(updater: IUpdater) {
  if (updaters.has(updater)) {
    return;
  }
  updaters.add(updater);
  setTimeout(() => {
    try {
      const { bindings, arrayElementBindings } = rebuild(updater);
      for(const arrayElementBinding of arrayElementBindings) {
        arrayElementBinding.binding.bindingNode.updateElements(updater.readonlyState, arrayElementBinding.listIndexes, arrayElementBinding.values);
      }
      updater.version++;
      updater.readonlyState[SetCacheableSymbol](() => {
        render(updater.readonlyState, bindings);
      })
    } finally {
      updaters.delete(updater);
    }
  }, 0);
}
