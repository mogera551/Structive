
const symbolName = "newState";

export const GetByContextSymbol            : unique symbol = Symbol.for(`${symbolName}.GetByRef`);
export const SetByContextSymbol            : unique symbol = Symbol.for(`${symbolName}.SetByRef`);
