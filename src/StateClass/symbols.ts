
const symbolName = "state";

export const GetByRefSymbol            : unique symbol = Symbol.for(`${symbolName}.GetByRef`);
export const SetByRefSymbol            : unique symbol = Symbol.for(`${symbolName}.SetByRef`);
export const GetAccessorSymbol         : unique symbol = Symbol.for(`${symbolName}.GetAccessor`);
export const ConnectedCallbackSymbol   : unique symbol = Symbol.for(`${symbolName}.ConnectedCallback`);
export const DisconnectedCallbackSymbol: unique symbol = Symbol.for(`${symbolName}.DisconnectedCallback`);
