
const symbolName = "componentState";

export const RenderSymbol : unique symbol = Symbol.for(`${symbolName}.render`);
export const BindParentComponentSymbol : unique symbol = Symbol.for(`${symbolName}.bindParentComponent`);
export const NamesSymbol : unique symbol = Symbol.for(`${symbolName}.names`);
export const GetPropertyValueFromChildSymbol : unique symbol = Symbol.for(`${symbolName}.GetPropertyValueFromChild`);
export const SetPropertyValueFromChildSymbol : unique symbol = Symbol.for(`${symbolName}.SetPropertyValueFromChild`);
