const symbolName = "state";
export const GetByRefSymbol = Symbol.for(`${symbolName}.GetByRef`);
export const SetByRefSymbol = Symbol.for(`${symbolName}.SetByRef`);
export const GetAccessorSymbol = Symbol.for(`${symbolName}.GetAccessor`);
export const ConnectedCallbackSymbol = Symbol.for(`${symbolName}.ConnectedCallback`);
export const DisconnectedCallbackSymbol = Symbol.for(`${symbolName}.DisconnectedCallback`);
