
const symbolName = "state";

export const GetByRefSymbol            : unique symbol = Symbol.for(`${symbolName}.GetByRef`);
export const SetByRefSymbol            : unique symbol = Symbol.for(`${symbolName}.SetByRef`);
export const SetCacheableSymbol        : unique symbol = Symbol.for(`${symbolName}.SetCacheable`);
export const ConnectedCallbackSymbol   : unique symbol = Symbol.for(`${symbolName}.ConnectedCallback`);
export const DisconnectedCallbackSymbol: unique symbol = Symbol.for(`${symbolName}.DisconnectedCallback`);
export const ResolveSymbol             : unique symbol = Symbol.for(`${symbolName}.Resolve`);
export const GetAllSymbol              : unique symbol = Symbol.for(`${symbolName}.GetAll`);
export const SetStatePropertyRefSymbol : unique symbol = Symbol.for(`${symbolName}.SetStatePropertyRef`);
export const SetLoopContextSymbol      : unique symbol = Symbol.for(`${symbolName}.SetLoopContext`);
