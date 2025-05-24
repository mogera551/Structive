
const symbolName = "state";

export const GetByRefSymbol            : unique symbol = Symbol.for(`${symbolName}.GetByRef`);
export const SetByRefSymbol            : unique symbol = Symbol.for(`${symbolName}.SetByRef`);
export const SetCacheableSymbol        : unique symbol = Symbol.for(`${symbolName}.SetCacheable`);
export const ConnectedCallbackSymbol   : unique symbol = Symbol.for(`${symbolName}.ConnectedCallback`);
export const DisconnectedCallbackSymbol: unique symbol = Symbol.for(`${symbolName}.DisconnectedCallback`);
export const SetLoopContextSymbol      : unique symbol = Symbol.for(`${symbolName}.SetLoopContext`);
