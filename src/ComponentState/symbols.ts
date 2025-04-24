
const symbolName = "componentState";

export const RenderSymbol : unique symbol = Symbol.for(`${symbolName}.render`);
export const BindParentComponentSymbol : unique symbol = Symbol.for(`${symbolName}.bindParentComponent`);
