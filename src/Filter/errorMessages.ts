
export function optionsRequired(fnName:string): never {
  throw new Error(`${fnName} requires at least one option`);
}

export function optionMustBeNumber(fnName:string): never {
  throw new Error(`${fnName} requires a number as option`);
}

export function valueMustBeNumber(fnName:string): never {
  throw new Error(`${fnName} requires a number value`);
}

export function valueMustBeBoolean(fnName:string): never {
  throw new Error(`${fnName} requires a boolean value`);
}

export function valueMustBeDate(fnName:string): never {
  throw new Error(`${fnName} requires a date value`);
}