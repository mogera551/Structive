const symbolName = "newState";
export const GetByContextSymbol = Symbol.for(`${symbolName}.GetByRef`);
export const SetByContextSymbol = Symbol.for(`${symbolName}.SetByRef`);
