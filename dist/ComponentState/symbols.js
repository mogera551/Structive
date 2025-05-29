const symbolName = "componentState";
export const RenderSymbol = Symbol.for(`${symbolName}.render`);
export const BindParentComponentSymbol = Symbol.for(`${symbolName}.bindParentComponent`);
export const NamesSymbol = Symbol.for(`${symbolName}.names`);
export const GetPropertyValueFromChildSymbol = Symbol.for(`${symbolName}.GetPropertyValueFromChild`);
export const SetPropertyValueFromChildSymbol = Symbol.for(`${symbolName}.SetPropertyValueFromChild`);
