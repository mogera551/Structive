export function optionsRequired(fnName) {
    throw new Error(`${fnName} requires at least one option`);
}
export function optionMustBeNumber(fnName) {
    throw new Error(`${fnName} requires a number as option`);
}
export function valueMustBeNumber(fnName) {
    throw new Error(`${fnName} requires a number value`);
}
export function valueMustBeBoolean(fnName) {
    throw new Error(`${fnName} requires a boolean value`);
}
export function valueMustBeDate(fnName) {
    throw new Error(`${fnName} requires a date value`);
}
