const symbolName = "state";
export const GetByRefSymbol = Symbol.for(`${symbolName}.GetByRef`);
export const SetByRefSymbol = Symbol.for(`${symbolName}.SetByRef`);
export const SetCacheableSymbol = Symbol.for(`${symbolName}.SetCacheable`);
export const ConnectedCallbackSymbol = Symbol.for(`${symbolName}.ConnectedCallback`);
export const DisconnectedCallbackSymbol = Symbol.for(`${symbolName}.DisconnectedCallback`);
export const SetStatePropertyRefSymbol = Symbol.for(`${symbolName}.SetStatePropertyRef`);
export const SetLoopContextSymbol = Symbol.for(`${symbolName}.SetLoopContext`);
