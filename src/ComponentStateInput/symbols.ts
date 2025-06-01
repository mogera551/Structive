const symbolName = "component-state-input";

export const AssignStateSymbol: unique symbol = Symbol.for(`${symbolName}.AssignState`);
export const NotifyRedrawSymbol: unique symbol = Symbol.for(`${symbolName}.NotifyRedraw`);